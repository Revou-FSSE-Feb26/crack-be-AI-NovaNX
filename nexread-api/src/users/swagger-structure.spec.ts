import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('User Swagger structure', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MeController, UsersController],
      providers: [{ provide: UsersService, useValue: {} }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('separates JWT-owned profile routes from admin user routes', () => {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .addTag('Me')
      .addTag('Admin')
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      autoTagControllers: false,
    });

    expect(document.paths['/me']?.get?.tags).toEqual(['Me']);
    expect(document.paths['/me']?.patch?.tags).toEqual(['Me']);
    expect(document.paths['/me']?.delete?.tags).toEqual(['Me']);
    expect(document.paths['/me/password']?.patch?.tags).toEqual(['Me']);

    expect(document.paths['/users']?.get?.tags).toEqual(['Admin']);
    expect(document.paths['/users/{id}']?.get?.tags).toEqual(['Admin']);
    expect(document.paths['/users/{id}']?.delete?.tags).toEqual(['Admin']);
    expect(document.paths['/users/{id}']?.patch).toBeUndefined();
    expect(document.paths['/users/{id}/role']?.patch?.tags).toEqual(['Admin']);
  });
});
