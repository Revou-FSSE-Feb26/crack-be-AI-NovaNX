import { Injectable } from '@nestjs/common';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReviewDto } from '../dto/create-review.dto';
import type { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewsRepository, type ReviewWithUser } from './reviews.repository';

const userFields = { id: true, fullName: true } as const;

@Injectable()
export class PrismaReviewsRepository implements ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookById(id: string): Promise<BookModel | null> {
    return this.prisma.book.findFirst({ where: { id, deletedAt: null } });
  }

  findById(id: number): Promise<ReviewWithUser | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: { user: { select: userFields } },
    });
  }

  findByUserAndBook(userId: number, bookId: string) {
    return this.prisma.review.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
  }

  findByBook(bookId: string): Promise<ReviewWithUser[]> {
    return this.prisma.review.findMany({
      where: { bookId, book: { deletedAt: null } },
      include: { user: { select: userFields } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    userId: number,
    bookId: string,
    data: CreateReviewDto,
  ): Promise<ReviewWithUser> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.create({
        data: { ...data, userId, bookId },
        include: { user: { select: userFields } },
      });
      await this.recalculateRating(transaction, bookId);
      return review;
    });
  }

  update(id: number, data: UpdateReviewDto): Promise<ReviewWithUser> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.update({
        where: { id },
        data,
        include: { user: { select: userFields } },
      });
      await this.recalculateRating(transaction, review.bookId);
      return review;
    });
  }

  delete(id: number): Promise<ReviewWithUser> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.delete({
        where: { id },
        include: { user: { select: userFields } },
      });
      await this.recalculateRating(transaction, review.bookId);
      return review;
    });
  }

  private async recalculateRating(
    transaction: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    bookId: string,
  ): Promise<void> {
    const aggregate = await transaction.review.aggregate({
      where: { bookId },
      _avg: { rating: true },
    });
    await transaction.book.update({
      where: { id: bookId },
      data: { rating: aggregate._avg.rating ?? 0 },
    });
  }
}
