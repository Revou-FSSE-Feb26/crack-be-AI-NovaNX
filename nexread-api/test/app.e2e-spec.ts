import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
  user: { id: number };
};

type HealthResponse = {
  status: string;
  timestamp: string;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testEmail: string | undefined;
  let testResourceSuffix: string | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('reports liveness and database readiness', async () => {
    const liveness = await request(app.getHttpServer())
      .get('/health/live')
      .expect('Cache-Control', 'no-store')
      .expect(200);
    const readiness = await request(app.getHttpServer())
      .get('/health/ready')
      .expect('Cache-Control', 'no-store')
      .expect(200);

    const livenessBody = liveness.body as HealthResponse;
    const readinessBody = readiness.body as HealthResponse;

    expect(livenessBody).toMatchObject({ status: 'ok' });
    expect(readinessBody).toMatchObject({ status: 'ok' });
    expect(livenessBody.timestamp).toEqual(expect.any(String));
    expect(readinessBody.timestamp).toEqual(expect.any(String));
  });

  it('rate limits repeated login attempts', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'missing@example.com', password: 'strong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'missing@example.com', password: 'strong-password' })
      .expect(429);
  });

  it('rotates and revokes refresh tokens', async () => {
    testEmail = `refresh-e2e-${Date.now()}@example.com`;
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Refresh E2E User',
        email: testEmail,
        password: 'strong-password',
      })
      .expect(201);
    const registrationBody = registration.body as AuthTokenPair;

    expect(registrationBody.accessToken).toEqual(expect.any(String));
    expect(registrationBody.refreshToken).toEqual(expect.any(String));

    const firstRefreshToken = registrationBody.refreshToken;
    const refresh = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(200);
    const refreshBody = refresh.body as AuthTokenPair;

    expect(refreshBody.accessToken).toEqual(expect.any(String));
    expect(refreshBody.refreshToken).toEqual(expect.any(String));
    expect(refreshBody.refreshToken).not.toBe(firstRefreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refreshBody.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshBody.refreshToken })
      .expect(401);
  });

  it('uses JWT identity for self-service routes and reserves /users for admins', async () => {
    testEmail = `me-e2e-${Date.now()}@example.com`;
    const password = 'strong-password';
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ fullName: 'Me E2E User', email: testEmail, password })
      .expect(201);
    const registrationBody = registration.body as AuthTokenPair;
    const authorization = `Bearer ${registrationBody.accessToken}`;

    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }: { body: { id: number; email: string } }) => {
        expect(body.id).toBe(registrationBody.user.id);
        expect(body.email).toBe(testEmail);
      });

    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', authorization)
      .send({ fullName: 'Updated Me E2E User' })
      .expect(200)
      .expect(({ body }: { body: { fullName: string } }) => {
        expect(body.fullName).toBe('Updated Me E2E User');
      });

    await request(app.getHttpServer())
      .get(`/users/${registrationBody.user.id}`)
      .set('Authorization', authorization)
      .expect(403);

    await request(app.getHttpServer())
      .patch('/me/password')
      .set('Authorization', authorization)
      .send({ currentPassword: password, newPassword: 'updated-password' })
      .expect(204);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'updated-password' })
      .expect(200);
    const loginBody = login.body as AuthTokenPair;

    await request(app.getHttpServer())
      .delete('/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(204);
  });

  it('borrows and returns a book atomically and exposes admin analytics', async () => {
    testResourceSuffix = `${Date.now()}`;
    const authorId = `loan-author-${testResourceSuffix}`;
    const categoryId = `loan-category-${testResourceSuffix}`;
    const bookId = `loan-book-${testResourceSuffix}`;
    testEmail = `loan-e2e-${testResourceSuffix}@example.com`;
    const password = 'strong-password';

    await prisma.author.create({
      data: { id: authorId, name: `Loan Author ${testResourceSuffix}` },
    });
    await prisma.category.create({
      data: {
        id: categoryId,
        name: `Loan Category ${testResourceSuffix}`,
        slug: categoryId,
      },
    });
    await prisma.book.create({
      data: {
        id: bookId,
        title: `Atomic Loan ${testResourceSuffix}`,
        rating: 4.7,
        authorId,
        categoryId,
      },
    });

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ fullName: 'Loan E2E User', email: testEmail, password })
      .expect(201);
    const registrationBody = registration.body as AuthTokenPair;
    const authorization = `Bearer ${registrationBody.accessToken}`;

    const borrowing = await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', authorization)
      .send({ bookId })
      .expect(201);
    const loan = borrowing.body as { id: number; status: string };
    expect(loan.status).toBe('ACTIVE');

    await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', authorization)
      .send({ bookId })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/books?title=atomic&available=false&minRating=4`)
      .expect(200)
      .expect(({ body }: { body: Array<{ id: string }> }) => {
        expect(body.some((book) => book.id === bookId)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/loans/${loan.id}/return`)
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }: { body: { status: string } }) => {
        expect(body.status).toBe('RETURNED');
      });

    await prisma.user.update({
      where: { id: registrationBody.user.id },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password })
      .expect(200);
    const adminBody = adminLogin.body as AuthTokenPair;
    const adminAuthorization = `Bearer ${adminBody.accessToken}`;

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', adminAuthorization)
      .expect(200)
      .expect(({ body }: { body: { books: number; users: number } }) => {
        expect(body.books).toBeGreaterThan(0);
        expect(body.users).toBeGreaterThan(0);
      });

    await request(app.getHttpServer())
      .get('/admin/loans')
      .set('Authorization', adminAuthorization)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: Array<{ id: number; user: Record<string, unknown> }>;
        }) => {
          const createdLoan = body.find((item) => item.id === loan.id);
          expect(createdLoan?.user).not.toHaveProperty('password');
          expect(createdLoan?.user).not.toHaveProperty('refreshTokenHash');
        },
      );

    await request(app.getHttpServer())
      .get('/admin/categories/statistics')
      .set('Authorization', adminAuthorization)
      .expect(200)
      .expect(
        ({ body }: { body: Array<{ id: string; booksCount: number }> }) => {
          expect(body).toContainEqual(
            expect.objectContaining({ id: categoryId, booksCount: 1 }),
          );
        },
      );
  });

  afterEach(async () => {
    if (testResourceSuffix) {
      const authorId = `loan-author-${testResourceSuffix}`;
      const categoryId = `loan-category-${testResourceSuffix}`;
      const bookId = `loan-book-${testResourceSuffix}`;
      await prisma.loan.deleteMany({ where: { bookId } });
      await prisma.book.deleteMany({ where: { id: bookId } });
      await prisma.category.deleteMany({ where: { id: categoryId } });
      await prisma.author.deleteMany({ where: { id: authorId } });
      testResourceSuffix = undefined;
    }

    if (testEmail) {
      await prisma.user.deleteMany({ where: { email: testEmail } });
      testEmail = undefined;
    }

    await app.close();
  });
});
