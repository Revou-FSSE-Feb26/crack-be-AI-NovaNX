import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoanStatus } from '../../generated/prisma/enums';
import { CreateLoanDto } from './dto/create-loan.dto';
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

  findMine(userId: number) {
    return this.loansRepository.findByUser(userId);
  }

  findAll() {
    return this.loansRepository.findAll();
  }

  async returnMine(userId: number, id: number) {
    const loan = await this.loansRepository.findById(id);

    if (!loan) {
      throw new NotFoundException(`Loan with id "${id}" not found`);
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('You can only return your own loan');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ConflictException('Loan has already been returned');
    }

    return this.loansRepository.returnLoan(loan);
  }
}
