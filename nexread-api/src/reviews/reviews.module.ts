import { Module } from '@nestjs/common';
import {
  BookReviewsController,
  MeReviewsController,
  ReviewsController,
} from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaReviewsRepository } from './repositories/prisma-reviews.repository';
import { ReviewsRepository } from './repositories/reviews.repository';

@Module({
  controllers: [BookReviewsController, ReviewsController, MeReviewsController],
  providers: [
    ReviewsService,
    { provide: ReviewsRepository, useClass: PrismaReviewsRepository },
  ],
})
export class ReviewsModule {}
