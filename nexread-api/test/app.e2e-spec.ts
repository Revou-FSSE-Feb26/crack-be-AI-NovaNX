import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testEmail: string | undefined;

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

  afterEach(async () => {
    if (testEmail) {
      await prisma.user.deleteMany({ where: { email: testEmail } });
      testEmail = undefined;
    }

    await app.close();
  });
});
