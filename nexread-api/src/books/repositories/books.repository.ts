import type {
  AuthorModel,
  BookModel,
  CategoryModel,
} from '../../../generated/prisma/models';
import type { CreateBookDto } from '../dto/create-book.dto';
import type { UpdateBookDto } from '../dto/update-book.dto';

/**
 * A `Book` together with its related `Author` and `Category`, as returned
 * by queries that eagerly include those relations.
 */
export type BookWithRelations = BookModel & {
  author: AuthorModel;
  category: CategoryModel;
};

/**
 * Repository contract for `Book` persistence.
 *
 * Services depend on this abstraction instead of `PrismaService` directly,
 * so the persistence implementation can be swapped (e.g. for tests, or a
 * different ORM/data source) without touching business logic.
 */
export abstract class BooksRepository {
  abstract create(data: CreateBookDto): Promise<BookModel>;
  abstract findAll(): Promise<BookWithRelations[]>;
  abstract findById(id: string): Promise<BookWithRelations | null>;
  abstract update(id: string, data: UpdateBookDto): Promise<BookModel>;
  abstract delete(id: string): Promise<BookModel>;
}
