import type {
  AuthorModel,
  BookModel,
  CategoryModel,
  LoanModel,
  UserModel,
} from '../../../generated/prisma/models';

export type LoanWithBook = LoanModel & {
  book: BookModel & { author: AuthorModel; category: CategoryModel };
};

export type SafeLoanUser = Omit<UserModel, 'password' | 'refreshTokenHash'>;
export type LoanWithRelations = LoanWithBook & { user: SafeLoanUser };

export abstract class LoansRepository {
  abstract findBookById(id: string): Promise<BookModel | null>;
  abstract findById(id: number): Promise<LoanWithRelations | null>;
  abstract findByUser(userId: number): Promise<LoanWithBook[]>;
  abstract findAll(): Promise<LoanWithRelations[]>;
  abstract borrow(
    userId: number,
    book: BookModel,
    dueAt: Date,
  ): Promise<LoanWithBook>;
  abstract returnLoan(loan: LoanWithRelations): Promise<LoanWithBook>;
}
