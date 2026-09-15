import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { BookCopyStatus, LoanStatus } from '../../../generated/prisma/enums';
import type { Prisma } from '../../../generated/prisma/client';
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

const loanBookRelations = {
  book: { include: bookRelations },
  bookCopy: true,
} as const;

const safeUserFields = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
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
        ...loanBookRelations,
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
        include: loanBookRelations,
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
          ...loanBookRelations,
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

  borrow(
    userId: number,
    book: BookModel,
    dueAt: Date,
    bookCopyId?: number,
  ): Promise<LoanWithBook> {
    return this.prisma.$transaction(async (transaction) => {
      const claimedCopyId = await this.claimAvailableCopy(
        transaction,
        book.id,
        bookCopyId,
      );
      await this.syncBookInventory(transaction, book.id);

      const loan = await transaction.loan.create({
        data: { userId, bookId: book.id, bookCopyId: claimedCopyId, dueAt },
        include: loanBookRelations,
      });

      await transaction.author.update({
        where: { id: book.authorId },
        data: { borrowedBooksCount: { increment: 1 } },
      });

      return loan;
    });
  }

  requestReturn(loan: LoanWithRelations): Promise<LoanWithBook> {
    return this.prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: LoanStatus.RETURN_REQUESTED,
        returnRequestedAt: new Date(),
      },
      include: loanBookRelations,
    });
  }

  returnLoan(
    loan: LoanWithRelations,
    returnedByAdminId: number,
  ): Promise<LoanWithBook> {
    return this.prisma.$transaction(async (transaction) => {
      const returnedAt = new Date();
      const loanUpdate = await transaction.loan.updateMany({
        where: {
          id: loan.id,
          status: { in: [LoanStatus.ACTIVE, LoanStatus.RETURN_REQUESTED] },
        },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt,
          returnedByAdminId,
        },
      });

      if (loanUpdate.count !== 1) {
        throw new ConflictException('Loan has already been returned');
      }

      if (loan.bookCopyId !== null) {
        const copyUpdate = await transaction.bookCopy.updateMany({
          where: { id: loan.bookCopyId, status: BookCopyStatus.LOANED },
          data: { status: BookCopyStatus.AVAILABLE },
        });
        if (copyUpdate.count !== 1) {
          throw new ConflictException('Physical copy is not currently loaned');
        }
        await this.syncBookInventory(transaction, loan.bookId);
      } else {
        const returnedBook = await transaction.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 }, isAvailable: true },
        });
        if (returnedBook.availableCopies > returnedBook.totalCopies) {
          throw new ConflictException(
            'Book inventory is already fully returned',
          );
        }
      }

      const updated = await transaction.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: loanBookRelations,
      });

      return updated;
    });
  }

  updateDueAt(id: number, dueAt: Date): Promise<LoanWithRelations> {
    return this.prisma.loan.update({
      where: { id },
      data: { dueAt },
      include: {
        ...loanBookRelations,
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
          status: {
            in: [LoanStatus.ACTIVE, LoanStatus.RETURN_REQUESTED],
          },
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
        const bookCopyId = await this.claimAvailableCopy(
          transaction,
          item.bookId,
        );
        await this.syncBookInventory(transaction, item.bookId);
        loans.push(
          await transaction.loan.create({
            data: { userId, bookId: item.bookId, bookCopyId, dueAt },
            include: loanBookRelations,
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

  private async claimAvailableCopy(
    transaction: Prisma.TransactionClient,
    bookId: string,
    requestedCopyId?: number,
  ): Promise<number> {
    const claimed = requestedCopyId
      ? await transaction.$queryRaw<Array<{ id: number }>>`
          UPDATE "BookCopy"
          SET "status" = 'LOANED', "updatedAt" = NOW()
          WHERE "id" = ${requestedCopyId}
            AND "bookId" = ${bookId}
            AND "status" = 'AVAILABLE'
          RETURNING "id"
        `
      : await transaction.$queryRaw<Array<{ id: number }>>`
          WITH candidate AS (
            SELECT "id"
            FROM "BookCopy"
            WHERE "bookId" = ${bookId} AND "status" = 'AVAILABLE'
            ORDER BY "id"
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          UPDATE "BookCopy" AS copy
          SET "status" = 'LOANED', "updatedAt" = NOW()
          FROM candidate
          WHERE copy."id" = candidate."id"
          RETURNING copy."id"
        `;

    if (!claimed[0]) {
      throw new ConflictException(
        requestedCopyId
          ? 'Requested physical copy is unavailable or belongs to another book'
          : 'Book has no available physical copy',
      );
    }
    return claimed[0].id;
  }

  private async syncBookInventory(
    transaction: Prisma.TransactionClient,
    bookId: string,
  ): Promise<void> {
    const [totalCopies, availableCopies] = await Promise.all([
      transaction.bookCopy.count({
        where: { bookId, status: { not: BookCopyStatus.ARCHIVED } },
      }),
      transaction.bookCopy.count({
        where: { bookId, status: BookCopyStatus.AVAILABLE },
      }),
    ]);
    await transaction.book.update({
      where: { id: bookId },
      data: {
        totalCopies,
        availableCopies,
        isAvailable: availableCopies > 0,
      },
    });
  }

  private statusWhere(status?: LoanFilter) {
    if (status === LoanFilter.ACTIVE) return { status: LoanStatus.ACTIVE };
    if (status === LoanFilter.RETURN_REQUESTED) {
      return { status: LoanStatus.RETURN_REQUESTED };
    }
    if (status === LoanFilter.RETURNED) return { status: LoanStatus.RETURNED };
    if (status === LoanFilter.OVERDUE) {
      return {
        status: { in: [LoanStatus.ACTIVE, LoanStatus.RETURN_REQUESTED] },
        dueAt: { lt: new Date() },
      };
    }
    return {};
  }
}
