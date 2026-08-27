import { ConflictException, NotFoundException } from '@nestjs/common';
import type { BookModel } from '../../generated/prisma/models';
import { CartService } from './cart.service';
import { CartRepository } from './repositories/cart.repository';

const book: BookModel = {
  id: 'book-1',
  title: 'Book One',
  rating: 4,
  coverClassName: null,
  authorId: 'author-1',
  categoryId: 'category-1',
  isAvailable: true,
  totalCopies: 1,
  availableCopies: 1,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CartService', () => {
  let repository: jest.Mocked<CartRepository>;
  let service: CartService;

  beforeEach(() => {
    repository = {
      findBookById: jest.fn(),
      findItem: jest.fn(),
      findByUser: jest.fn(),
      getCheckout: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };
    service = new CartService(repository);
  });

  it('rejects duplicate cart books', async () => {
    repository.findBookById.mockResolvedValue(book);
    repository.findItem.mockResolvedValue({
      id: 1,
      userId: 1,
      bookId: book.id,
      createdAt: new Date(),
    });

    await expect(service.add(1, { bookId: book.id })).rejects.toThrow(
      ConflictException,
    );
  });

  it('does not let a user remove another cart item', async () => {
    repository.remove.mockResolvedValue(false);
    await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
  });
});
