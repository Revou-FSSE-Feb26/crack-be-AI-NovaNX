import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { BookCopyStatus, LoanStatus, Role } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { LoansService } from '../loans/loans.service';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { QueryBookCopiesDto } from './dto/query-book-copies.dto';
import { UpdateBookCopyStatusDto } from './dto/update-book-copy-status.dto';

const unreturnedLoanStatuses: LoanStatus[] = [
  LoanStatus.ACTIVE,
  LoanStatus.RETURN_REQUESTED,
];

const copyInclude = {
  book: { select: { id: true, title: true } },
  loans: {
    where: {
      status: { in: unreturnedLoanStatuses },
    },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    take: 1,
  },
} as const;

@Injectable()
export class BookCopiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansService: LoansService,
  ) {}

  async create(data: CreateBookCopyDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: data.bookId, deletedAt: null },
      select: { id: true },
    });
    if (!book) {
      throw new NotFoundException(`Book with id "${data.bookId}" not found`);
    }

    const copy = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.bookCopy.create({
        data,
        include: copyInclude,
      });
      await this.syncBookInventory(transaction, data.bookId);
      return created;
    });
    return this.toResponse(copy);
  }

  async findAll(query: QueryBookCopiesDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      bookId: query.bookId,
      status: query.status,
      OR: query.q
        ? [
            { barcode: { contains: query.q, mode: 'insensitive' as const } },
            { shelfCode: { contains: query.q, mode: 'insensitive' as const } },
            {
              book: {
                title: { contains: query.q, mode: 'insensitive' as const },
              },
            },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bookCopy.findMany({
        where,
        include: copyInclude,
        orderBy: [{ book: { title: 'asc' } }, { barcode: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookCopy.count({ where }),
    ]);
    return {
      data: data.map((copy) => this.toResponse(copy)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findAvailable(query: QueryBookCopiesDto = {}) {
    return this.findAll({ ...query, status: BookCopyStatus.AVAILABLE });
  }

  async findOne(id: number) {
    const copy = await this.prisma.bookCopy.findUnique({
      where: { id },
      include: copyInclude,
    });
    if (!copy) {
      throw new NotFoundException(`Book copy with id "${id}" not found`);
    }
    return this.toResponse(copy);
  }

  async findByBarcode(barcode: string) {
    const copy = await this.prisma.bookCopy.findUnique({
      where: { barcode },
      include: copyInclude,
    });
    if (!copy) {
      throw new NotFoundException(
        `Book copy with barcode "${barcode}" not found`,
      );
    }
    return this.toResponse(copy);
  }

  async findHistory(id: number) {
    await this.findOne(id);
    return this.prisma.bookCopyAuditLog.findMany({
      where: { bookCopyId: id },
      include: {
        actorAdmin: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async updateStatus(
    actorAdminId: number,
    id: number,
    data: UpdateBookCopyStatusDto,
  ) {
    if (data.status === BookCopyStatus.LOANED) {
      throw new BadRequestException(
        'LOANED status can only be assigned by borrowing a copy',
      );
    }

    const existing = await this.prisma.bookCopy.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Book copy with id "${id}" not found`);
    }
    if (existing.status === BookCopyStatus.LOANED) {
      throw new ConflictException(
        'A loaned copy must be returned through the loan workflow',
      );
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const { note, ...copyUpdate } = data;
      const copy = await transaction.bookCopy.update({
        where: { id },
        data: copyUpdate,
        include: copyInclude,
      });
      await transaction.bookCopyAuditLog.create({
        data: {
          bookCopyId: id,
          actorAdminId,
          previousStatus: existing.status,
          newStatus: data.status,
          note,
        },
      });
      await this.syncBookInventory(transaction, existing.bookId);
      return copy;
    });
    return this.toResponse(updated);
  }

  async returnByBarcode(adminUserId: number, barcode: string) {
    const copy = await this.prisma.bookCopy.findUnique({
      where: { barcode },
      include: {
        loans: {
          where: {
            status: { in: [LoanStatus.ACTIVE, LoanStatus.RETURN_REQUESTED] },
          },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!copy) {
      throw new NotFoundException(
        `Book copy with barcode "${barcode}" not found`,
      );
    }
    const activeLoan = copy.loans[0];
    if (!activeLoan) {
      throw new ConflictException('Physical copy has no active loan');
    }
    return this.loansService.returnLoan(adminUserId, Role.ADMIN, activeLoan.id);
  }

  private toResponse<T extends { loans: unknown[] }>(copy: T) {
    const { loans, ...result } = copy;
    return { ...result, activeLoan: loans[0] ?? null };
  }

  private async syncBookInventory(
    transaction: Prisma.TransactionClient,
    bookId: string,
  ) {
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
}
