import { Injectable } from '@nestjs/common';
import type {
  BookModel,
  CartItemModel,
} from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CartRepository,
  type CartCheckout,
  type CartItemWithBook,
} from './cart.repository';

const bookRelations = { author: true, category: true } as const;
const safeUserFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookById(id: string): Promise<BookModel | null> {
    return this.prisma.book.findFirst({ where: { id, deletedAt: null } });
  }

  findItem(userId: number, bookId: string): Promise<CartItemModel | null> {
    return this.prisma.cartItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
  }

  findByUser(userId: number): Promise<CartItemWithBook[]> {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { book: { include: bookRelations } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCheckout(userId: number): Promise<CartCheckout> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: safeUserFields,
    });
    return { user, items: await this.findByUser(userId) };
  }

  add(userId: number, bookId: string): Promise<CartItemWithBook> {
    return this.prisma.cartItem.create({
      data: { userId, bookId },
      include: { book: { include: bookRelations } },
    });
  }

  async remove(userId: number, id: number): Promise<boolean> {
    const result = await this.prisma.cartItem.deleteMany({
      where: { id, userId },
    });
    return result.count === 1;
  }

  async clear(userId: number): Promise<number> {
    const result = await this.prisma.cartItem.deleteMany({ where: { userId } });
    return result.count;
  }
}
