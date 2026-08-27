import type {
  AuthorModel,
  BookModel,
  CategoryModel,
  ReviewModel,
} from '../../../generated/prisma/models';
import type { QueryReviewsDto } from '../dto/query-reviews.dto';
import type { CreateReviewDto } from '../dto/create-review.dto';
import type { UpdateReviewDto } from '../dto/update-review.dto';

export type ReviewWithUser = ReviewModel & {
  user: { id: number; fullName: string };
};
export type MyReview = ReviewWithUser & {
  book: BookModel & { author: AuthorModel; category: CategoryModel };
};
export type PaginatedMyReviews = {
  data: MyReview[];
  total: number;
  page: number;
  limit: number;
};

export abstract class ReviewsRepository {
  abstract findBookById(id: string): Promise<BookModel | null>;
  abstract findById(id: number): Promise<ReviewWithUser | null>;
  abstract findByUserAndBook(
    userId: number,
    bookId: string,
  ): Promise<ReviewModel | null>;
  abstract findByBook(bookId: string): Promise<ReviewWithUser[]>;
  abstract findByUser(
    userId: number,
    query?: QueryReviewsDto,
  ): Promise<PaginatedMyReviews>;
  abstract create(
    userId: number,
    bookId: string,
    data: CreateReviewDto,
  ): Promise<ReviewWithUser>;
  abstract update(id: number, data: UpdateReviewDto): Promise<ReviewWithUser>;
  abstract delete(id: number): Promise<ReviewWithUser>;
}
