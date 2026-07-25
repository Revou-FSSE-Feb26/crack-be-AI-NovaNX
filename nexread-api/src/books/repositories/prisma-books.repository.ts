import { Injectable } from '@nestjs/common';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBookDto } from '../dto/create-book.dto';
import type { UpdateBookDto } from '../dto/update-book.dto';
import { BooksRepository, type BookWithRelations } from './books.repository';

/**
 * Prisma-backed implementation of `BooksRepository`.
 */
@Injectable()
export class PrismaBooksRepository implements BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateBookDto): Promise<BookModel> {
    return this.prisma.book.create({ data });
  }

  findAll(): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany({
      include: { author: true, category: true },
    });
  }

  findById(id: string): Promise<BookWithRelations | null> {
    return this.prisma.book.findUnique({
      where: { id },
      include: { author: true, category: true },
    });
  }

  update(id: string, data: UpdateBookDto): Promise<BookModel> {
    return this.prisma.book.update({ where: { id }, data });
  }

  delete(id: string): Promise<BookModel> {
    return this.prisma.book.delete({ where: { id } });
  }
}
