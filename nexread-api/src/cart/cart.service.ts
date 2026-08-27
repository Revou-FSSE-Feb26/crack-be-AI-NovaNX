import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartRepository } from './repositories/cart.repository';

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  findMine(userId: number) {
    return this.cartRepository.findByUser(userId);
  }

  async getCheckout(userId: number) {
    const checkout = await this.cartRepository.getCheckout(userId);
    return { ...checkout, totalItems: checkout.items.length };
  }

  async add(userId: number, data: AddCartItemDto) {
    const book = await this.cartRepository.findBookById(data.bookId);
    if (!book) {
      throw new NotFoundException(`Book with id "${data.bookId}" not found`);
    }
    if (!book.isAvailable || book.availableCopies < 1) {
      throw new ConflictException('Book is currently unavailable');
    }
    if (await this.cartRepository.findItem(userId, data.bookId)) {
      throw new ConflictException('Book is already in your cart');
    }
    return this.cartRepository.add(userId, data.bookId);
  }

  async remove(userId: number, id: number): Promise<void> {
    if (!(await this.cartRepository.remove(userId, id))) {
      throw new NotFoundException(`Cart item with id "${id}" not found`);
    }
  }

  async clear(userId: number): Promise<void> {
    await this.cartRepository.clear(userId);
  }
}
