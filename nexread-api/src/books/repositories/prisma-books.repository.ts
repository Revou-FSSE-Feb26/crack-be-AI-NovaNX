import { ConflictException, Injectable } from '@nestjs/common';
import { LoanStatus } from '../../../generated/prisma/enums';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBookDto } from '../dto/create-book.dto';
import type { QueryBooksDto } from '../dto/query-books.dto';
import type { UpdateBookDto } from '../dto/update-book.dto';
import { BooksRepository, type PaginatedBooks } from './books.repository';

const safeReviewUserFields = {
  id: true,
  fullName: true,
} as const;

/**
 * Prisma-backed implementation of `BooksRepository`.
 */
@Injectable()
export class PrismaBooksRepository implements BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateBookDto): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const totalCopies = data.totalCopies ?? 1;
      const book = await transaction.book.create({
        data: { ...data, totalCopies, availableCopies: totalCopies },
      });
      await transaction.author.update({
        where: { id: data.authorId },
        data: { booksCount: { increment: 1 } },
      });
      return book;
    });
  }

  async findAll(query: QueryBooksDto = {}): Promise<PaginatedBooks> {
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.bookWhere(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { author: true, category: true },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findRecommended(query: QueryBooksDto = {}): Promise<PaginatedBooks> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.bookWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { author: true, category: true },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: true,
        category: true,
        reviews: {
          include: { user: { select: safeReviewUserFields } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    });
  }

  countActiveLoans(id: string): Promise<number> {
    return this.prisma.loan.count({
      where: { bookId: id, status: LoanStatus.ACTIVE },
    });
  }

  update(id: string, data: UpdateBookDto): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.book.findUniqueOrThrow({
        where: { id },
      });
      const { totalCopies, ...bookData } = data;
      let inventoryData = {};

      if (totalCopies !== undefined) {
        const activeLoans = await transaction.loan.count({
          where: { bookId: id, status: LoanStatus.ACTIVE },
        });
        if (totalCopies < activeLoans) {
          throw new ConflictException(
            `totalCopies cannot be lower than ${activeLoans} active loans`,
          );
        }
        const availableCopies = totalCopies - activeLoans;
        inventoryData = {
          totalCopies,
          availableCopies,
          isAvailable: availableCopies > 0,
        };
      }

      const book = await transaction.book.update({
        where: { id },
        data: { ...bookData, ...inventoryData },
      });

      if (data.authorId && data.authorId !== existing.authorId) {
        await transaction.author.update({
          where: { id: existing.authorId },
          data: { booksCount: { decrement: 1 } },
        });
        await transaction.author.update({
          where: { id: data.authorId },
          data: { booksCount: { increment: 1 } },
        });
      }

      return book;
    });
  }

  deleteOrArchive(id: string): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const historicalReferences = await transaction.book.findUniqueOrThrow({
        where: { id },
        select: { _count: { select: { loans: true, reviews: true } } },
      });
      const hasHistory =
        historicalReferences._count.loans > 0 ||
        historicalReferences._count.reviews > 0;
      const book = hasHistory
        ? await transaction.book.update({
            where: { id },
            data: {
              deletedAt: new Date(),
              isAvailable: false,
              availableCopies: 0,
            },
          })
        : await transaction.book.delete({ where: { id } });
      await transaction.author.update({
        where: { id: book.authorId },
        data: { booksCount: { decrement: 1 } },
      });
      return book;
    });
  }

  private bookWhere(query: QueryBooksDto) {
    return {
      deletedAt: null,
      title: query.title
        ? { contains: query.title, mode: 'insensitive' as const }
        : undefined,
      authorId: query.authorId,
      categoryId: query.categoryId,
      rating:
        query.minRating === undefined ? undefined : { gte: query.minRating },
      isAvailable: query.available,
    };
  }
}
