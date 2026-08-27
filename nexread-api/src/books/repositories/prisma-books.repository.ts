import { Injectable } from '@nestjs/common';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBookDto } from '../dto/create-book.dto';
import type { QueryBooksDto } from '../dto/query-books.dto';
import type { UpdateBookDto } from '../dto/update-book.dto';
import { BooksRepository, type BookWithRelations } from './books.repository';

/**
 * Prisma-backed implementation of `BooksRepository`.
 */
@Injectable()
export class PrismaBooksRepository implements BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateBookDto): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const book = await transaction.book.create({ data });
      await transaction.author.update({
        where: { id: data.authorId },
        data: { booksCount: { increment: 1 } },
      });
      return book;
    });
  }

  findAll(query: QueryBooksDto = {}): Promise<BookWithRelations[]> {
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    return this.prisma.book.findMany({
      where: {
        title: query.title
          ? { contains: query.title, mode: 'insensitive' }
          : undefined,
        authorId: query.authorId,
        categoryId: query.categoryId,
        rating:
          query.minRating === undefined ? undefined : { gte: query.minRating },
        isAvailable: query.available,
      },
      include: { author: true, category: true },
      orderBy: { [sortBy]: order },
    });
  }

  findById(id: string): Promise<BookWithRelations | null> {
    return this.prisma.book.findUnique({
      where: { id },
      include: { author: true, category: true },
    });
  }

  update(id: string, data: UpdateBookDto): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.book.findUniqueOrThrow({
        where: { id },
      });
      const book = await transaction.book.update({ where: { id }, data });

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

  delete(id: string): Promise<BookModel> {
    return this.prisma.$transaction(async (transaction) => {
      const book = await transaction.book.delete({ where: { id } });
      await transaction.author.update({
        where: { id: book.authorId },
        data: { booksCount: { decrement: 1 } },
      });
      return book;
    });
  }
}
