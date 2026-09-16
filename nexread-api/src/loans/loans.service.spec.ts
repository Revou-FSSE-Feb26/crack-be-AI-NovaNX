import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LoanStatus, Role } from '../../generated/prisma/enums';
import type { BookModel } from '../../generated/prisma/models';
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

const book: BookModel = {
  id: 'book-1',
  title: 'Book One',
  rating: 4,
  coverClassName: null,
  coverUrl: null,
  description: null,
  pageCount: null,
  authorId: 'author-1',
  categoryId: 'category-1',
  isAvailable: true,
  totalCopies: 1,
  availableCopies: 1,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('LoansService', () => {
  let repository: jest.Mocked<LoansRepository>;
  let service: LoansService;

  beforeEach(() => {
    repository = {
      findBookById: jest.fn(),
      findUserRole: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findAll: jest.fn(),
      borrow: jest.fn(),
      requestReturn: jest.fn(),
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
    expect(repository.returnLoan.mock.calls[0]).toEqual([loan, 99]);
  });

  it('borrows an available book with the default due date', async () => {
    repository.findBookById.mockResolvedValue(book);
    repository.borrow.mockResolvedValue(loan);

    await service.borrow(loan.userId, { bookId: book.id, bookCopyId: 3 });

    expect(repository.borrow.mock.calls).toHaveLength(1);
    expect(repository.borrow.mock.calls[0]?.slice(0, 2)).toEqual([
      loan.userId,
      book,
    ]);
    expect(repository.borrow.mock.calls[0]?.[2]).toBeInstanceOf(Date);
    expect(repository.borrow.mock.calls[0]?.[3]).toBe(3);
  });

  it('rejects borrowing a missing or unavailable book', async () => {
    repository.findBookById.mockResolvedValueOnce(null);
    await expect(
      service.borrow(loan.userId, { bookId: 'missing' }),
    ).rejects.toThrow(NotFoundException);

    repository.findBookById.mockResolvedValueOnce({
      ...book,
      isAvailable: false,
    });
    await expect(
      service.borrow(loan.userId, { bookId: book.id }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects an invalid custom due date', async () => {
    repository.findBookById.mockResolvedValue(book);
    await expect(
      service.borrow(loan.userId, {
        bookId: book.id,
        dueAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('paginates user and admin loan lists', async () => {
    const page = { data: [loan], total: 1, page: 1, limit: 10 };
    repository.findByUser.mockResolvedValue(page);
    repository.findAll.mockResolvedValue(page);

    await expect(service.findMine(loan.userId, {})).resolves.toMatchObject({
      meta: { total: 1, totalPages: 1 },
    });
    await expect(service.findAll({})).resolves.toMatchObject({
      meta: { total: 1, totalPages: 1 },
    });
    await service.findOverdue({ page: 2 });
    expect(repository.findAll.mock.calls[1]?.[0]).toMatchObject({
      status: 'OVERDUE',
      page: 2,
    });
  });

  it('requires an existing user for an admin-created loan', async () => {
    repository.findUserRole.mockResolvedValue(null);
    await expect(
      service.adminBorrow({ userId: 99, bookId: book.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an admin account as the target of an admin-created loan', async () => {
    repository.findUserRole.mockResolvedValue(Role.ADMIN);
    await expect(
      service.adminBorrow({ userId: 99, bookId: book.id }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.borrow.mock.calls).toHaveLength(0);
  });

  it('allows an admin to create a loan for a user account', async () => {
    repository.findUserRole.mockResolvedValue(Role.USER);
    repository.findBookById.mockResolvedValue(book);
    repository.borrow.mockResolvedValue(loan);
    await service.adminBorrow({ userId: loan.userId, bookId: book.id });
    expect(repository.borrow.mock.calls).toHaveLength(1);
  });

  it('only requests approval when a borrower returns their own loan', async () => {
    repository.findById.mockResolvedValue(loan);
    repository.requestReturn.mockResolvedValue({
      ...loan,
      status: LoanStatus.RETURN_REQUESTED,
    });

    await service.returnLoan(loan.userId, Role.USER, loan.id);

    expect(repository.requestReturn.mock.calls).toEqual([[loan]]);
    expect(repository.returnLoan.mock.calls).toHaveLength(0);
  });

  it('rejects a non-owner user returning another user loan', async () => {
    repository.findById.mockResolvedValue(loan);
    await expect(service.returnLoan(99, Role.USER, loan.id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a duplicate return request', async () => {
    repository.findById.mockResolvedValue({
      ...loan,
      status: LoanStatus.RETURN_REQUESTED,
    });
    await expect(
      service.returnLoan(loan.userId, Role.USER, loan.id),
    ).rejects.toThrow(ConflictException);
  });

  it('lets an admin update a valid loan due date', async () => {
    const dueAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
    repository.findById.mockResolvedValue(loan);
    repository.updateDueAt.mockResolvedValue(loan);

    await service.adminUpdate(99, loan.id, { dueAt });

    expect(repository.updateDueAt.mock.calls).toHaveLength(1);
    expect(repository.updateDueAt.mock.calls[0]?.[0]).toBe(loan.id);
    expect(repository.updateDueAt.mock.calls[0]?.[1]).toBeInstanceOf(Date);
  });

  it('lets an admin approve a requested return', async () => {
    const requestedLoan = {
      ...loan,
      status: LoanStatus.RETURN_REQUESTED,
    };
    repository.findById.mockResolvedValue(requestedLoan);
    repository.returnLoan.mockResolvedValue({
      ...requestedLoan,
      status: LoanStatus.RETURNED,
    });

    await service.adminUpdate(99, loan.id, { status: LoanStatus.RETURNED });

    expect(repository.returnLoan.mock.calls).toEqual([[requestedLoan, 99]]);
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
