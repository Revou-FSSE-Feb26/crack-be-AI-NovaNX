import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { LoanStatus } from '../../../generated/prisma/enums';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanFilter, type QueryLoansDto } from '../dto/query-loans.dto';
import {
  LoansRepository,
  type LoanWithBook,
  type LoanWithRelations,
  type PaginatedLoans,
} from './loans.repository';

const bookRelations = {
  author: true,
  category: true,
} as const;

const safeUserFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaLoansRepository implements LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookById(id: string): Promise<BookModel | null> {
    return this.prisma.book.findFirst({ where: { id, deletedAt: null } });
  }

  async userExists(id: number): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id } })) === 1;
  }

  findById(id: number): Promise<LoanWithRelations | null> {
    return this.prisma.loan.findUnique({
      where: { id },
      include: {
        book: { include: bookRelations },
        user: { select: safeUserFields },
      },
    });
  }

  async findByUser(
    userId: number,
    query: QueryLoansDto = {},
  ): Promise<PaginatedLoans<LoanWithBook>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      userId,
      ...this.statusWhere(query.status),
      book: query.q
        ? { title: { contains: query.q, mode: 'insensitive' as const } }
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.loan.findMany({
        where,
        include: { book: { include: bookRelations } },
        orderBy: { borrowedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(
    query: QueryLoansDto = {},
  ): Promise<PaginatedLoans<LoanWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      ...this.statusWhere(query.status),
      OR: query.q
        ? [
            {
              book: {
                title: { contains: query.q, mode: 'insensitive' as const },
              },
            },
            {
              user: {
                fullName: { contains: query.q, mode: 'insensitive' as const },
              },
            },
            {
              user: {
                email: { contains: query.q, mode: 'insensitive' as const },
              },
            },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.loan.findMany({
        where,
        include: {
          book: { include: bookRelations },
          user: { select: safeUserFields },
        },
        orderBy: { borrowedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  borrow(userId: number, book: BookModel, dueAt: Date): Promise<LoanWithBook> {
    return this.prisma.$transaction(async (transaction) => {
      const updatedCopies = await transaction.$executeRaw`
        UPDATE "Book"
        SET "availableCopies" = "availableCopies" - 1,
            "isAvailable" = ("availableCopies" - 1) > 0,
            "updatedAt" = NOW()
        WHERE "id" = ${book.id}
          AND "deletedAt" IS NULL
          AND "availableCopies" > 0
      `;

      if (updatedCopies !== 1) {
        throw new ConflictException('Book is currently unavailable');
      }

      const loan = await transaction.loan.create({
        data: { userId, bookId: book.id, dueAt },
        include: { book: { include: bookRelations } },
      });

      await transaction.author.update({
        where: { id: book.authorId },
        data: { borrowedBooksCount: { increment: 1 } },
      });

      return loan;
    });
  }

  returnLoan(loan: LoanWithRelations): Promise<LoanWithBook> {
    return this.prisma.$transaction(async (transaction) => {
      const returnedAt = new Date();
      const loanUpdate = await transaction.loan.updateMany({
        where: { id: loan.id, status: LoanStatus.ACTIVE },
        data: { status: LoanStatus.RETURNED, returnedAt },
      });

      if (loanUpdate.count !== 1) {
        throw new ConflictException('Loan has already been returned');
      }

      const returnedBook = await transaction.book.update({
        where: { id: loan.bookId },
        data: { availableCopies: { increment: 1 }, isAvailable: true },
      });

      if (returnedBook.availableCopies > returnedBook.totalCopies) {
        throw new ConflictException('Book inventory is already fully returned');
      }

      const updated = await transaction.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: { book: { include: bookRelations } },
      });

      return updated;
    });
  }

  updateDueAt(id: number, dueAt: Date): Promise<LoanWithRelations> {
    return this.prisma.loan.update({
      where: { id },
      data: { dueAt },
      include: {
        book: { include: bookRelations },
        user: { select: safeUserFields },
      },
    });
  }

  borrowFromCart(userId: number, dueAt: Date): Promise<LoanWithBook[]> {
    return this.prisma.$transaction(async (transaction) => {
      const items = await transaction.cartItem.findMany({
        where: { userId },
        include: { book: true },
        orderBy: { createdAt: 'asc' },
      });
      if (items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const activeLoans = await transaction.loan.count({
        where: {
          userId,
          status: LoanStatus.ACTIVE,
          bookId: { in: items.map((item) => item.bookId) },
        },
      });
      if (activeLoans > 0) {
        throw new ConflictException(
          'A cart book is already actively borrowed by this user',
        );
      }

      const loans: LoanWithBook[] = [];
      for (const item of items) {
        const updatedCopies = await transaction.$executeRaw`
          UPDATE "Book"
          SET "availableCopies" = "availableCopies" - 1,
              "isAvailable" = ("availableCopies" - 1) > 0,
              "updatedAt" = NOW()
          WHERE "id" = ${item.bookId}
            AND "deletedAt" IS NULL
            AND "availableCopies" > 0
        `;
        if (updatedCopies !== 1) {
          throw new ConflictException(
            `Book with id "${item.bookId}" is currently unavailable`,
          );
        }
        loans.push(
          await transaction.loan.create({
            data: { userId, bookId: item.bookId, dueAt },
            include: { book: { include: bookRelations } },
          }),
        );
        await transaction.author.update({
          where: { id: item.book.authorId },
          data: { borrowedBooksCount: { increment: 1 } },
        });
      }
      await transaction.cartItem.deleteMany({ where: { userId } });
      return loans;
    });
  }

  private statusWhere(status?: LoanFilter) {
    if (status === LoanFilter.ACTIVE) return { status: LoanStatus.ACTIVE };
    if (status === LoanFilter.RETURNED) return { status: LoanStatus.RETURNED };
    if (status === LoanFilter.OVERDUE) {
      return { status: LoanStatus.ACTIVE, dueAt: { lt: new Date() } };
    }
    return {};
  }
}
