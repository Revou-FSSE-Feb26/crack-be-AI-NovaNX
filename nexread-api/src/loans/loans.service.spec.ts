import { ForbiddenException } from '@nestjs/common';
import { LoanStatus, Role } from '../../generated/prisma/enums';
import type { LoanWithRelations } from './repositories/loans.repository';
import { LoansRepository } from './repositories/loans.repository';
import { LoansService } from './loans.service';

const loan = {
  id: 1,
  userId: 7,
  bookId: 'book-1',
  status: LoanStatus.ACTIVE,
  borrowedAt: new Date(),
  dueAt: new Date(Date.now() + 86_400_000),
  returnedAt: null,
  book: {},
  user: {},
} as LoanWithRelations;

describe('LoansService', () => {
  let repository: jest.Mocked<LoansRepository>;
  let service: LoansService;

  beforeEach(() => {
    repository = {
      findBookById: jest.fn(),
      userExists: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findAll: jest.fn(),
      borrow: jest.fn(),
      returnLoan: jest.fn(),
      updateDueAt: jest.fn(),
      borrowFromCart: jest.fn(),
    };
    service = new LoansService(repository);
  });

  it('allows an admin to return another user loan', async () => {
    repository.findById.mockResolvedValue(loan);
    repository.returnLoan.mockResolvedValue(loan);

    await service.returnLoan(99, Role.ADMIN, loan.id);

    expect(repository.returnLoan.mock.calls).toHaveLength(1);
  });

  it('rejects a non-owner user returning another user loan', async () => {
    repository.findById.mockResolvedValue(loan);
    await expect(service.returnLoan(99, Role.USER, loan.id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('uses an allow-listed cart loan duration', async () => {
    repository.borrowFromCart.mockResolvedValue([]);
    await service.checkoutCart(7, { durationDays: 5 });

    const dueAt = repository.borrowFromCart.mock.calls[0][1];
    const durationDays = (dueAt.getTime() - Date.now()) / 86_400_000;
    expect(durationDays).toBeGreaterThan(4.99);
    expect(durationDays).toBeLessThanOrEqual(5);
  });
});
