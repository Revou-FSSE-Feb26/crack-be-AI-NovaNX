import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoanStatus, Role } from '../../generated/prisma/enums';
import { AdminCreateLoanDto, AdminUpdateLoanDto } from './dto/admin-loan.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanFilter, QueryLoansDto } from './dto/query-loans.dto';
import { LoansRepository } from './repositories/loans.repository';

const DEFAULT_LOAN_DAYS = 14;
const MAX_LOAN_DAYS = 365;

@Injectable()
export class LoansService {
  constructor(private readonly loansRepository: LoansRepository) {}

  async borrow(userId: number, createLoanDto: CreateLoanDto) {
    const book = await this.loansRepository.findBookById(createLoanDto.bookId);

    if (!book) {
      throw new NotFoundException(
        `Book with id "${createLoanDto.bookId}" not found`,
      );
    }

    if (!book.isAvailable) {
      throw new ConflictException('Book is currently unavailable');
    }

    const now = new Date();
    const maximumDueAt = new Date(now);
    maximumDueAt.setDate(maximumDueAt.getDate() + MAX_LOAN_DAYS);
    const dueAt = createLoanDto.dueAt
      ? new Date(createLoanDto.dueAt)
      : new Date(now.getTime() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);

    if (dueAt <= now || dueAt > maximumDueAt) {
      throw new ConflictException(
        `Loan due date must be within the next ${MAX_LOAN_DAYS} days`,
      );
    }

    return this.loansRepository.borrow(userId, book, dueAt);
  }

  async findMine(userId: number, query: QueryLoansDto) {
    return this.toPaginatedResponse(
      await this.loansRepository.findByUser(userId, query),
    );
  }

  async findAll(query: QueryLoansDto) {
    return this.toPaginatedResponse(await this.loansRepository.findAll(query));
  }

  findOverdue(query: QueryLoansDto) {
    return this.findAll({ ...query, status: LoanFilter.OVERDUE });
  }

  async adminBorrow(data: AdminCreateLoanDto) {
    if (!(await this.loansRepository.userExists(data.userId))) {
      throw new NotFoundException(`User with id "${data.userId}" not found`);
    }
    return this.borrow(data.userId, { bookId: data.bookId, dueAt: data.dueAt });
  }

  async returnLoan(userId: number, role: Role, id: number) {
    const loan = await this.loansRepository.findById(id);

    if (!loan) {
      throw new NotFoundException(`Loan with id "${id}" not found`);
    }

    if (loan.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can only return your own loan');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ConflictException('Loan has already been returned');
    }

    return this.loansRepository.returnLoan(loan);
  }

  async adminUpdate(id: number, data: AdminUpdateLoanDto) {
    if (!data.dueAt && !data.status) {
      throw new BadRequestException('dueAt or status must be provided');
    }
    let loan = await this.loansRepository.findById(id);
    if (!loan) {
      throw new NotFoundException(`Loan with id "${id}" not found`);
    }
    if (data.dueAt) {
      const dueAt = this.validateDueAt(data.dueAt);
      loan = await this.loansRepository.updateDueAt(id, dueAt);
    }
    if (data.status === LoanStatus.RETURNED) {
      if (loan.status !== LoanStatus.ACTIVE) {
        throw new ConflictException('Loan has already been returned');
      }
      return this.loansRepository.returnLoan(loan);
    }
    return loan;
  }

  checkoutCart(userId: number, data: CheckoutCartDto) {
    const dueAt = new Date(
      Date.now() + data.durationDays * 24 * 60 * 60 * 1000,
    );
    return this.loansRepository.borrowFromCart(userId, dueAt);
  }

  private validateDueAt(value: string) {
    const now = new Date();
    const dueAt = new Date(value);
    const maximumDueAt = new Date(now);
    maximumDueAt.setDate(maximumDueAt.getDate() + MAX_LOAN_DAYS);
    if (dueAt <= now || dueAt > maximumDueAt) {
      throw new ConflictException(
        `Loan due date must be within the next ${MAX_LOAN_DAYS} days`,
      );
    }
    return dueAt;
  }

  private toPaginatedResponse(result: {
    data: unknown[];
    total: number;
    page: number;
    limit: number;
  }) {
    return {
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
