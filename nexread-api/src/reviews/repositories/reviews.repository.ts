import type { BookModel, ReviewModel } from '../../../generated/prisma/models';
import type { CreateReviewDto } from '../dto/create-review.dto';
import type { UpdateReviewDto } from '../dto/update-review.dto';

export type ReviewWithUser = ReviewModel & {
  user: { id: number; fullName: string };
};

export abstract class ReviewsRepository {
  abstract findBookById(id: string): Promise<BookModel | null>;
  abstract findById(id: number): Promise<ReviewWithUser | null>;
  abstract findByUserAndBook(
    userId: number,
    bookId: string,
  ): Promise<ReviewModel | null>;
  abstract findByBook(bookId: string): Promise<ReviewWithUser[]>;
  abstract create(
    userId: number,
    bookId: string,
    data: CreateReviewDto,
  ): Promise<ReviewWithUser>;
  abstract update(id: number, data: UpdateReviewDto): Promise<ReviewWithUser>;
  abstract delete(id: number): Promise<ReviewWithUser>;
}
