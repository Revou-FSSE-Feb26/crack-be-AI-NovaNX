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
      data: {
        id: authorId,
        name: `Loan Author ${testResourceSuffix}`,
        booksCount: 1,
      },
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
        totalCopies: 2,
        availableCopies: 2,
      },
    });

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ fullName: 'Loan E2E User', email: testEmail, password })
      .expect(201);
    const registrationBody = registration.body as AuthTokenPair;
    const authorization = `Bearer ${registrationBody.accessToken}`;

    await request(app.getHttpServer())
      .get(`/authors?q=loan author&page=1&limit=1`)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { data: Array<{ id: string }>; meta: { total: number } };
        }) => {
          expect(body.data).toContainEqual(
            expect.objectContaining({ id: authorId }),
          );
          expect(body.meta.total).toBeGreaterThan(0);
        },
      );

    await request(app.getHttpServer())
      .get(`/authors/${authorId}/books?page=1&limit=5`)
      .expect(200)
      .expect(({ body }: { body: { data: Array<{ authorId: string }> } }) => {
        expect(body.data).toContainEqual(expect.objectContaining({ authorId }));
      });

    await request(app.getHttpServer())
      .get('/authors/popular?page=1&limit=5')
      .expect(200)
      .expect(
        ({ body }: { body: { data: Array<{ popularityScore: number }> } }) => {
          expect(body.data[0]?.popularityScore).toEqual(expect.any(Number));
        },
      );

    const borrowing = await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', authorization)
      .send({ bookId })
      .expect(201);
    const loan = borrowing.body as { id: number; status: string };
    expect(loan.status).toBe('ACTIVE');

    const secondBorrowing = await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', authorization)
      .send({ bookId })
      .expect(201);
    const secondLoan = secondBorrowing.body as { id: number; status: string };

    await request(app.getHttpServer())
      .post('/loans')
      .set('Authorization', authorization)
      .send({ bookId })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/books?title=atomic&available=false&minRating=4&page=1&limit=1`)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            data: Array<{ id: string; availableCopies: number }>;
            meta: { page: number; limit: number; total: number };
          };
        }) => {
          expect(body.data).toContainEqual(
            expect.objectContaining({ id: bookId, availableCopies: 0 }),
          );
          expect(body.meta).toMatchObject({ page: 1, limit: 1, total: 1 });
        },
      );

    await request(app.getHttpServer())
      .get('/books/recommend?page=1&limit=5')
      .expect(200)
      .expect(({ body }: { body: { data: unknown[]; meta: object } }) => {
        expect(body.data).toBeInstanceOf(Array);
        expect(body.meta).toBeDefined();
      });

    const createdReview = await request(app.getHttpServer())
      .post(`/books/${bookId}/reviews`)
      .set('Authorization', authorization)
      .send({ rating: 5, comment: 'Excellent inventory test' })
      .expect(201);
    const review = createdReview.body as { id: number };

    await request(app.getHttpServer())
      .post(`/books/${bookId}/reviews`)
      .set('Authorization', authorization)
      .send({ rating: 4 })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/reviews/${review.id}`)
      .set('Authorization', authorization)
      .send({ rating: 4, comment: 'Updated review' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/books/${bookId}`)
      .expect(200)
      .expect(({ body }: { body: { rating: number; reviewCount: number } }) => {
        expect(body.rating).toBe(4);
        expect(body.reviewCount).toBe(1);
      });

    await request(app.getHttpServer())
      .get(`/books/${bookId}/reviews`)
      .expect(200)
      .expect(({ body }: { body: Array<{ id: number }> }) => {
        expect(body).toContainEqual(expect.objectContaining({ id: review.id }));
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
      .delete(`/authors/${authorId}`)
      .set('Authorization', adminAuthorization)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/books/${bookId}`)
      .set('Authorization', adminAuthorization)
      .expect(409);

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
      .patch(`/loans/${secondLoan.id}/return`)
      .set('Authorization', adminAuthorization)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/reviews/${review.id}`)
      .set('Authorization', adminAuthorization)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/books/${bookId}`)
      .set('Authorization', adminAuthorization)
      .expect(200);

    await request(app.getHttpServer()).get(`/books/${bookId}`).expect(404);

    await request(app.getHttpServer())
      .delete(`/authors/${authorId}`)
      .set('Authorization', adminAuthorization)
      .expect(200);

    await request(app.getHttpServer()).get(`/authors/${authorId}`).expect(404);

    await request(app.getHttpServer())
      .get('/admin/categories/statistics')
      .set('Authorization', adminAuthorization)
      .expect(200)
      .expect(
        ({ body }: { body: Array<{ id: string; booksCount: number }> }) => {
          expect(body).toContainEqual(
            expect.objectContaining({ id: categoryId, booksCount: 0 }),
          );
        },
      );
  });

  afterEach(async () => {
    if (testResourceSuffix) {
      const authorId = `loan-author-${testResourceSuffix}`;
      const categoryId = `loan-category-${testResourceSuffix}`;
      const bookId = `loan-book-${testResourceSuffix}`;
      await prisma.review.deleteMany({ where: { bookId } });
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
