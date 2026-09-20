/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookCopyStatus, Role } from '../../generated/prisma/enums';
import { LoansService } from '../loans/loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookCopiesService } from './book-copies.service';

describe('BookCopiesService', () => {
  let prisma: any;
  let loansService: jest.Mocked<LoansService>;
  let service: BookCopiesService;

  const copy = {
    id: 1,
    bookId: 'book-1',
    barcode: 'NX-001',
    shelfCode: 'A-1',
    status: BookCopyStatus.AVAILABLE,
    book: { id: 'book-1', title: 'Book' },
    loans: [],
  };

  beforeEach(() => {
    prisma = {
      book: { findFirst: jest.fn() },
      bookCopy: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      bookCopyAuditLog: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    loansService = {
      returnLoan: jest.fn(),
    } as unknown as jest.Mocked<LoansService>;
    service = new BookCopiesService(prisma as PrismaService, loansService);
  });

  it('rejects creation for a missing book', async () => {
    prisma.book.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ bookId: 'missing', barcode: 'NX-001' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a copy and synchronizes aggregate inventory', async () => {
    prisma.book.findFirst.mockResolvedValue({ id: 'book-1' });
    const transaction = {
      bookCopy: {
        create: jest.fn().mockResolvedValue(copy),
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2),
      },
      book: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation((callback: any) =>
      callback(transaction),
    );

    await expect(
      service.create({ bookId: 'book-1', barcode: 'NX-001' }),
    ).resolves.toEqual(expect.objectContaining({ id: 1, activeLoan: null }));
    expect(transaction.book.update).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { totalCopies: 3, availableCopies: 2, isAvailable: true },
    });
  });

  it('lists and filters available copies with pagination', async () => {
    prisma.$transaction.mockResolvedValue([[copy], 11]);
    await expect(
      service.findAll({ page: 2, limit: 5, q: 'NX' }),
    ).resolves.toEqual({
      data: [expect.objectContaining({ id: 1, activeLoan: null })],
      meta: { page: 2, limit: 5, total: 11, totalPages: 3 },
    });

    const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    await service.findAvailable({ bookId: 'book-1' });
    expect(findAllSpy).toHaveBeenCalledWith({
      bookId: 'book-1',
      status: BookCopyStatus.AVAILABLE,
    });
  });

  it('finds copies by id and barcode and reports missing copies', async () => {
    prisma.bookCopy.findUnique.mockResolvedValueOnce(copy);
    await expect(service.findOne(1)).resolves.toEqual(
      expect.objectContaining({ activeLoan: null }),
    );
    prisma.bookCopy.findUnique.mockResolvedValueOnce(copy);
    await expect(service.findByBarcode('NX-001')).resolves.toEqual(
      expect.objectContaining({ id: 1 }),
    );
    prisma.bookCopy.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    prisma.bookCopy.findUnique.mockResolvedValueOnce(null);
    await expect(service.findByBarcode('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns audit history after verifying the copy', async () => {
    prisma.bookCopy.findUnique.mockResolvedValue(copy);
    prisma.bookCopyAuditLog.findMany.mockResolvedValue([{ id: 10 }]);
    await expect(service.findHistory(1)).resolves.toEqual([{ id: 10 }]);
  });

  it('rejects invalid manual status transitions', async () => {
    await expect(
      service.updateStatus(1, 1, { status: BookCopyStatus.LOANED }),
    ).rejects.toThrow(BadRequestException);

    prisma.bookCopy.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.updateStatus(1, 99, { status: BookCopyStatus.ARCHIVED }),
    ).rejects.toThrow(NotFoundException);

    prisma.bookCopy.findUnique.mockResolvedValueOnce({
      ...copy,
      status: BookCopyStatus.LOANED,
    });
    await expect(
      service.updateStatus(1, 1, { status: BookCopyStatus.DAMAGED }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates status, writes audit log, and synchronizes inventory', async () => {
    prisma.bookCopy.findUnique.mockResolvedValue(copy);
    const updated = { ...copy, status: BookCopyStatus.DAMAGED };
    const transaction = {
      bookCopy: {
        update: jest.fn().mockResolvedValue(updated),
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(1),
      },
      bookCopyAuditLog: { create: jest.fn() },
      book: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation((callback: any) =>
      callback(transaction),
    );

    await service.updateStatus(7, 1, {
      status: BookCopyStatus.DAMAGED,
      note: 'Damaged cover',
    });
    expect(transaction.bookCopyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorAdminId: 7, bookCopyId: 1 }),
    });
  });

  it('processes barcode returns only when an active loan exists', async () => {
    prisma.bookCopy.findUnique.mockResolvedValueOnce(null);
    await expect(service.returnByBarcode(1, 'missing')).rejects.toThrow(
      NotFoundException,
    );

    prisma.bookCopy.findUnique.mockResolvedValueOnce({ ...copy, loans: [] });
    await expect(service.returnByBarcode(1, 'NX-001')).rejects.toThrow(
      ConflictException,
    );

    prisma.bookCopy.findUnique.mockResolvedValueOnce({
      ...copy,
      loans: [{ id: 42 }],
    });
    loansService.returnLoan.mockResolvedValue({ id: 42 } as never);
    await service.returnByBarcode(9, 'NX-001');
    expect(loansService.returnLoan).toHaveBeenCalledWith(9, Role.ADMIN, 42);
  });
});
