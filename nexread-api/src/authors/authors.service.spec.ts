import { ConflictException } from '@nestjs/common';
import type { AuthorModel } from '../../generated/prisma/models';
import { BooksService } from '../books/books.service';
import { AuthorsService } from './authors.service';
import { AuthorsRepository } from './repositories/authors.repository';

const author: AuthorModel = {
  id: 'author-1',
  name: 'Author One',
  booksCount: 1,
  borrowedBooksCount: 2,
  rating: 4.5,
  avatarPath: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: jest.Mocked<AuthorsRepository>;
  let booksService: { findAll: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findPopular: jest.fn(),
      findById: jest.fn(),
      countVisibleBooks: jest.fn(),
      update: jest.fn(),
      deleteOrArchive: jest.fn(),
    };
    booksService = { findAll: jest.fn() };
    service = new AuthorsService(
      repository,
      booksService as unknown as BooksService,
    );
  });

  it('returns searched authors with pagination metadata', async () => {
    repository.findAll.mockResolvedValue({
      data: [author],
      total: 1,
      page: 1,
      limit: 10,
    });
    const publicAuthor = { ...author };
    delete publicAuthor.deletedAt;

    await expect(service.findAll({ q: 'one' })).resolves.toEqual({
      data: [publicAuthor],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('forces the path author id when listing books', async () => {
    repository.findById.mockResolvedValue(author);
    booksService.findAll.mockResolvedValue({ data: [], meta: {} });

    await service.findBooks('author-1', {
      authorId: 'untrusted-query-id',
      page: 2,
    });

    expect(booksService.findAll).toHaveBeenCalledWith({
      authorId: 'author-1',
      page: 2,
    });
  });

  it('rejects deletion while visible books remain', async () => {
    repository.findById.mockResolvedValue(author);
    repository.countVisibleBooks.mockResolvedValue(1);

    await expect(service.remove('author-1')).rejects.toThrow(ConflictException);
    expect(repository.deleteOrArchive.mock.calls).toHaveLength(0);
  });

  it('deletes or archives an author without visible books', async () => {
    repository.findById.mockResolvedValue(author);
    repository.countVisibleBooks.mockResolvedValue(0);
    repository.deleteOrArchive.mockResolvedValue({
      ...author,
      deletedAt: new Date(),
    });

    await service.remove('author-1');

    expect(repository.deleteOrArchive.mock.calls).toContainEqual(['author-1']);
  });
});
