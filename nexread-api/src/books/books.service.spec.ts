/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksRepository } from './repositories/books.repository';

describe('BooksService', () => {
  let repository: jest.Mocked<BooksRepository>;
  let service: BooksService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findRecommended: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      countActiveLoans: jest.fn(),
      deleteOrArchive: jest.fn(),
    };
    service = new BooksService(repository);
  });

  it('creates a book and prioritizes the uploaded cover URL', async () => {
    repository.create.mockResolvedValue({ id: 'book-1' } as never);
    await service.create(
      {
        id: 'book-1',
        title: 'Clean Architecture',
        authorId: 'author-1',
        categoryId: 'category-1',
        coverUrl: '/old.png',
      },
      '/covers/new.png',
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ coverUrl: '/covers/new.png' }),
    );
  });

  it('maps pagination for catalogue and recommendations', async () => {
    const result = { data: [{ id: '1' }], total: 11, page: 2, limit: 5 };
    repository.findAll.mockResolvedValue(result as never);
    repository.findRecommended.mockResolvedValue(result as never);

    await expect(service.findAll()).resolves.toEqual({
      data: result.data,
      meta: { page: 2, limit: 5, total: 11, totalPages: 3 },
    });
    await expect(service.findRecommended()).resolves.toEqual({
      data: result.data,
      meta: { page: 2, limit: 5, total: 11, totalPages: 3 },
    });
  });

  it('returns book detail with review count and handles a missing book', async () => {
    repository.findById.mockResolvedValueOnce({
      id: 'book-1',
      title: 'Book',
      _count: { reviews: 3 },
    });
    await expect(service.findOne('book-1')).resolves.toEqual({
      id: 'book-1',
      title: 'Book',
      reviewCount: 3,
    });

    repository.findById.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates valid inventory and rejects totals below active loans', async () => {
    repository.findById.mockResolvedValue({ id: 'book-1' });
    repository.countActiveLoans.mockResolvedValueOnce(2);
    await expect(service.update('book-1', { totalCopies: 1 })).rejects.toThrow(
      ConflictException,
    );

    repository.countActiveLoans.mockResolvedValueOnce(1);
    repository.update.mockResolvedValue({ id: 'book-1' } as never);
    await service.update(
      'book-1',
      { totalCopies: 2, coverUrl: '/old.png' },
      '/new.png',
    );
    expect(repository.update).toHaveBeenCalledWith(
      'book-1',
      expect.objectContaining({ totalCopies: 2, coverUrl: '/new.png' }),
    );
  });

  it('prevents deletion with active loans and archives an unused book', async () => {
    repository.findById.mockResolvedValue({ id: 'book-1' });
    repository.countActiveLoans.mockResolvedValueOnce(1);
    await expect(service.remove('book-1')).rejects.toThrow(ConflictException);

    repository.countActiveLoans.mockResolvedValueOnce(0);
    repository.deleteOrArchive.mockResolvedValue({ id: 'book-1' } as never);
    await service.remove('book-1');
    expect(repository.deleteOrArchive).toHaveBeenCalledWith('book-1');
  });
});
