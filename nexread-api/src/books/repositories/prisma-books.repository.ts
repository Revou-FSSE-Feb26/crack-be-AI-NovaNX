import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BookCopyStatus, LoanStatus } from '../../../generated/prisma/enums';
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
        data: {
          ...data,
          totalCopies,
          availableCopies: totalCopies,
          copies: {
            create: Array.from({ length: totalCopies }, (_, index) => ({
              barcode: this.generatedBarcode(data.id, index + 1),
            })),
          },
        },
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
        const copies = await transaction.bookCopy.findMany({
          where: { bookId: id, status: { not: BookCopyStatus.ARCHIVED } },
          orderBy: { id: 'desc' },
        });
        const difference = totalCopies - copies.length;
        if (difference > 0) {
          await transaction.bookCopy.createMany({
            data: Array.from({ length: difference }, (_, index) => ({
              bookId: id,
              barcode: this.generatedBarcode(id, index + 1, true),
            })),
          });
        } else if (difference < 0) {
          const removableCopies = copies.filter(
            (copy) => copy.status !== BookCopyStatus.LOANED,
          );
          if (removableCopies.length < Math.abs(difference)) {
            const activeLoans = copies.length - removableCopies.length;
            throw new ConflictException(
              `totalCopies cannot be lower than ${activeLoans} loaned physical copies`,
            );
          }
          await transaction.bookCopy.updateMany({
            where: {
              id: {
                in: removableCopies
                  .slice(0, Math.abs(difference))
                  .map((copy) => copy.id),
              },
            },
            data: { status: BookCopyStatus.ARCHIVED },
          });
        }

        const [physicalTotal, availableCopies] = await Promise.all([
          transaction.bookCopy.count({
            where: { bookId: id, status: { not: BookCopyStatus.ARCHIVED } },
          }),
          transaction.bookCopy.count({
            where: { bookId: id, status: BookCopyStatus.AVAILABLE },
          }),
        ]);
        if (physicalTotal !== totalCopies) {
          throw new ConflictException(
            'Physical copy inventory could not be reconciled',
          );
        }
        inventoryData = {
          totalCopies: physicalTotal,
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
      const [historicalReferences, copyAuditCount] = await Promise.all([
        transaction.book.findUniqueOrThrow({
          where: { id },
          select: { _count: { select: { loans: true, reviews: true } } },
        }),
        transaction.bookCopyAuditLog.count({
          where: { bookCopy: { bookId: id } },
        }),
      ]);
      const hasHistory =
        historicalReferences._count.loans > 0 ||
        historicalReferences._count.reviews > 0 ||
        copyAuditCount > 0;
      const book = hasHistory
        ? await (async () => {
            await transaction.bookCopy.updateMany({
              where: { bookId: id },
              data: { status: BookCopyStatus.ARCHIVED },
            });
            return transaction.book.update({
              where: { id },
              data: {
                deletedAt: new Date(),
                isAvailable: false,
                availableCopies: 0,
              },
            });
          })()
        : await (async () => {
            await transaction.bookCopy.deleteMany({ where: { bookId: id } });
            return transaction.book.delete({ where: { id } });
          })();
      await transaction.author.update({
        where: { id: book.authorId },
        data: { booksCount: { decrement: 1 } },
      });
      return book;
    });
  }

  private generatedBarcode(
    bookId: string,
    copyNumber: number,
    uniqueSuffix = false,
  ): string {
    const normalized = bookId.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
    const suffix = uniqueSuffix
      ? `${Date.now()}-${copyNumber}-${randomUUID().slice(0, 8)}`
      : String(copyNumber).padStart(3, '0');
    return `NXR-${normalized}-${suffix}`;
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
