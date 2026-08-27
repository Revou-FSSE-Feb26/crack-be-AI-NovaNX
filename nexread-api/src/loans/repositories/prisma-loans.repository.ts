import { ConflictException, Injectable } from '@nestjs/common';
import { LoanStatus } from '../../../generated/prisma/enums';
import type { BookModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LoansRepository,
  type LoanWithBook,
  type LoanWithRelations,
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

  findById(id: number): Promise<LoanWithRelations | null> {
    return this.prisma.loan.findUnique({
      where: { id },
      include: {
        book: { include: bookRelations },
        user: { select: safeUserFields },
      },
    });
  }

  findByUser(userId: number): Promise<LoanWithBook[]> {
    return this.prisma.loan.findMany({
      where: { userId },
      include: { book: { include: bookRelations } },
      orderBy: { borrowedAt: 'desc' },
    });
  }

  findAll(): Promise<LoanWithRelations[]> {
    return this.prisma.loan.findMany({
      include: {
        book: { include: bookRelations },
        user: { select: safeUserFields },
      },
      orderBy: { borrowedAt: 'desc' },
    });
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
}
