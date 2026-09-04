import type {
  AuthorModel,
  BookModel,
  CategoryModel,
  LoanModel,
  UserModel,
} from '../../../generated/prisma/models';
import type { QueryLoansDto } from '../dto/query-loans.dto';

export type LoanWithBook = LoanModel & {
  book: BookModel & { author: AuthorModel; category: CategoryModel };
};

export type SafeLoanUser = Pick<
  UserModel,
  'id' | 'fullName' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;
export type LoanWithRelations = LoanWithBook & { user: SafeLoanUser };
export type PaginatedLoans<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export abstract class LoansRepository {
  abstract findBookById(id: string): Promise<BookModel | null>;
  abstract userExists(id: number): Promise<boolean>;
  abstract findById(id: number): Promise<LoanWithRelations | null>;
  abstract findByUser(
    userId: number,
    query?: QueryLoansDto,
  ): Promise<PaginatedLoans<LoanWithBook>>;
  abstract findAll(
    query?: QueryLoansDto,
  ): Promise<PaginatedLoans<LoanWithRelations>>;
  abstract borrow(
    userId: number,
    book: BookModel,
    dueAt: Date,
  ): Promise<LoanWithBook>;
  abstract returnLoan(loan: LoanWithRelations): Promise<LoanWithBook>;
  abstract updateDueAt(id: number, dueAt: Date): Promise<LoanWithRelations>;
  abstract borrowFromCart(userId: number, dueAt: Date): Promise<LoanWithBook[]>;
}
