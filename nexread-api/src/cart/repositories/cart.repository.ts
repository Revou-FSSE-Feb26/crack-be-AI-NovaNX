import type {
  AuthorModel,
  BookModel,
  CartItemModel,
  CategoryModel,
} from '../../../generated/prisma/models';
import type { SafeLoanUser } from '../../loans/repositories/loans.repository';

export type CartItemWithBook = CartItemModel & {
  book: BookModel & { author: AuthorModel; category: CategoryModel };
};

export type CartCheckout = {
  user: SafeLoanUser;
  items: CartItemWithBook[];
};

export abstract class CartRepository {
  abstract findBookById(id: string): Promise<BookModel | null>;
  abstract findItem(
    userId: number,
    bookId: string,
  ): Promise<CartItemModel | null>;
  abstract findByUser(userId: number): Promise<CartItemWithBook[]>;
  abstract getCheckout(userId: number): Promise<CartCheckout>;
  abstract add(userId: number, bookId: string): Promise<CartItemWithBook>;
  abstract remove(userId: number, id: number): Promise<boolean>;
  abstract clear(userId: number): Promise<number>;
}
