import 'dotenv/config';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import {
  corsOriginsFromEnvironment,
  validateEnvironment,
} from './config/environment';

async function bootstrap() {
  validateEnvironment();

  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({
      json: isProduction,
      colors: !isProduction,
    }),
  });
  const httpLogger = new Logger('HTTP');

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const incomingRequestId = request.header('x-request-id');
    const requestId =
      incomingRequestId && /^[a-zA-Z0-9._-]{1,128}$/.test(incomingRequestId)
        ? incomingRequestId
        : randomUUID();
    const startedAt = Date.now();

    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      httpLogger.log({
        event: 'http_request',
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  });
  app.enableCors({
    origin: corsOriginsFromEnvironment(),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexRead API')
    .setDescription('API documentation for the NexRead library catalog service')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health')
    .addTag('Auth')
    .addTag('Me', 'User profile and personal data')
    .addTag('Books')
    .addTag('Authors')
    .addTag('Categories')
    .addTag('Loans')
    .addTag('Reviews')
    .addTag('Cart')
    .addTag('Admin', 'Admin-only endpoints and dashboard')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false,
  });
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
