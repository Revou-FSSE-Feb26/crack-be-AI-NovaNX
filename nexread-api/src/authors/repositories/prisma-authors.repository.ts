import { Injectable } from '@nestjs/common';
import type { AuthorModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAuthorDto } from '../dto/create-author.dto';
import type {
  QueryAuthorsDto,
  QueryPopularAuthorsDto,
} from '../dto/query-authors.dto';
import type { UpdateAuthorDto } from '../dto/update-author.dto';
import {
  AuthorsRepository,
  type PaginatedAuthors,
  type PaginatedPopularAuthors,
  type PopularAuthor,
} from './authors.repository';

/**
 * Prisma-backed implementation of `AuthorsRepository`.
 */
@Injectable()
export class PrismaAuthorsRepository implements AuthorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAuthorDto): Promise<AuthorModel> {
    return this.prisma.author.create({ data });
  }

  async findAll(query: QueryAuthorsDto = {}): Promise<PaginatedAuthors> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      deletedAt: null,
      name: query.q
        ? { contains: query.q, mode: 'insensitive' as const }
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.author.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.author.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findPopular(
    query: QueryPopularAuthorsDto = {},
  ): Promise<PaginatedPopularAuthors> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [authors, books, reviewCounts, loanCounts] = await Promise.all([
      this.prisma.author.findMany({ where: { deletedAt: null } }),
      this.prisma.book.findMany({
        where: { deletedAt: null },
        select: { id: true, authorId: true, rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['bookId'],
        _count: { _all: true },
      }),
      this.prisma.loan.groupBy({
        by: ['bookId'],
        _count: { _all: true },
      }),
    ]);
    const reviewsByBook = new Map(
      reviewCounts.map((row) => [row.bookId, row._count._all]),
    );
    const loansByBook = new Map(
      loanCounts.map((row) => [row.bookId, row._count._all]),
    );
    const booksByAuthor = new Map<string, typeof books>();
    for (const book of books) {
      const authorBooks = booksByAuthor.get(book.authorId) ?? [];
      authorBooks.push(book);
      booksByAuthor.set(book.authorId, authorBooks);
    }

    const ranked: PopularAuthor[] = authors
      .map((author) => {
        const authorBooks = booksByAuthor.get(author.id) ?? [];
        const reviewCount = authorBooks.reduce(
          (total, book) => total + (reviewsByBook.get(book.id) ?? 0),
          0,
        );
        const borrowCount = authorBooks.reduce(
          (total, book) => total + (loansByBook.get(book.id) ?? 0),
          0,
        );
        const averageBookRating = this.roundMetric(
          authorBooks.length
            ? authorBooks.reduce((total, book) => total + book.rating, 0) /
                authorBooks.length
            : 0,
        );
        const ratingPoints = authorBooks.reduce(
          (total, book) =>
            total + book.rating * Math.max(reviewsByBook.get(book.id) ?? 0, 1),
          0,
        );
        const popularityScore = this.roundMetric(
          ratingPoints +
            Math.log10(reviewCount + 1) +
            Math.log10(borrowCount + 1),
        );
        return {
          ...author,
          booksCount: authorBooks.length,
          reviewCount,
          borrowCount,
          averageBookRating,
          popularityScore,
        };
      })
      .sort(
        (left, right) =>
          right.popularityScore - left.popularityScore ||
          right.averageBookRating - left.averageBookRating ||
          left.name.localeCompare(right.name),
      );
    const total = ranked.length;
    return {
      data: ranked.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
    };
  }

  findById(id: string): Promise<AuthorModel | null> {
    return this.prisma.author.findFirst({ where: { id, deletedAt: null } });
  }

  countVisibleBooks(id: string): Promise<number> {
    return this.prisma.book.count({ where: { authorId: id, deletedAt: null } });
  }

  update(id: string, data: UpdateAuthorDto): Promise<AuthorModel> {
    return this.prisma.author.update({ where: { id }, data });
  }

  deleteOrArchive(id: string): Promise<AuthorModel> {
    return this.prisma.$transaction(async (transaction) => {
      const bookCount = await transaction.book.count({
        where: { authorId: id },
      });
      return bookCount > 0
        ? transaction.author.update({
            where: { id },
            data: { deletedAt: new Date() },
          })
        : transaction.author.delete({ where: { id } });
    });
  }

  private roundMetric(value: number) {
    return Math.round(value * 100) / 100;
  }
}
