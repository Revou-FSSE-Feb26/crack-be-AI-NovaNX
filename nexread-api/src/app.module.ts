import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { positiveIntegerFromEnvironment } from './config/environment';
import { HealthModule } from './health/health.module';
import { LoansModule } from './loans/loans.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: positiveIntegerFromEnvironment('RATE_LIMIT_TTL_MS', 60_000),
        limit: positiveIntegerFromEnvironment('RATE_LIMIT_MAX', 120),
        blockDuration: positiveIntegerFromEnvironment(
          'RATE_LIMIT_TTL_MS',
          60_000,
        ),
      },
    ]),
    PrismaModule,
    AuthorsModule,
    CategoriesModule,
    BooksModule,
    UsersModule,
    AuthModule,
    HealthModule,
    LoansModule,
    AdminModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
