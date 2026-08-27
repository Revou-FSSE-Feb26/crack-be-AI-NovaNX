import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';
import type { BookModel } from '../../generated/prisma/models';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsService } from './reviews.service';

const book = { id: 'book-1', deletedAt: null } as BookModel;
const review = {
  id: 1,
  userId: 7,
  bookId: 'book-1',
  rating: 5,
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 7, fullName: 'Reviewer' },
};

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repository: jest.Mocked<ReviewsRepository>;

  beforeEach(() => {
    repository = {
      findBookById: jest.fn(),
      findById: jest.fn(),
      findByUserAndBook: jest.fn(),
      findByBook: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new ReviewsService(repository);
  });

  it('creates one review for an existing book', async () => {
    repository.findBookById.mockResolvedValue(book);
    repository.findByUserAndBook.mockResolvedValue(null);
    repository.create.mockResolvedValue(review);

    await expect(service.create(7, 'book-1', { rating: 5 })).resolves.toBe(
      review,
    );
  });

  it('rejects a duplicate user/book review', async () => {
    repository.findBookById.mockResolvedValue(book);
    repository.findByUserAndBook.mockResolvedValue(review);

    await expect(service.create(7, 'book-1', { rating: 4 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects changes by another regular user', async () => {
    repository.findById.mockResolvedValue(review);

    await expect(
      service.update(8, Role.USER, 1, { rating: 3 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an admin to moderate another user review', async () => {
    repository.findById.mockResolvedValue(review);
    repository.delete.mockResolvedValue(review);

    await expect(service.remove(8, Role.ADMIN, 1)).resolves.toBe(review);
  });

  it('returns 404 for a missing review', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.remove(7, Role.USER, 99)).rejects.toThrow(
      NotFoundException,
    );
  });
});
