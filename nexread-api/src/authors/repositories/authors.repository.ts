import type { AuthorModel } from '../../../generated/prisma/models';
import type { CreateAuthorDto } from '../dto/create-author.dto';
import type {
  QueryAuthorsDto,
  QueryPopularAuthorsDto,
} from '../dto/query-authors.dto';
import type { UpdateAuthorDto } from '../dto/update-author.dto';

/**
 * Repository contract for `Author` persistence.
 *
 * Services depend on this abstraction instead of `PrismaService` directly,
 * so the persistence implementation can be swapped (e.g. for tests, or a
 * different ORM/data source) without touching business logic.
 */
export abstract class AuthorsRepository {
  abstract create(data: CreateAuthorDto): Promise<AuthorModel>;
  abstract findAll(query?: QueryAuthorsDto): Promise<PaginatedAuthors>;
  abstract findPopular(
    query?: QueryPopularAuthorsDto,
  ): Promise<PaginatedPopularAuthors>;
  abstract findById(id: string): Promise<AuthorModel | null>;
  abstract countVisibleBooks(id: string): Promise<number>;
  abstract update(id: string, data: UpdateAuthorDto): Promise<AuthorModel>;
  abstract deleteOrArchive(id: string): Promise<AuthorModel>;
}
export type PaginatedAuthors = {
  data: AuthorModel[];
  total: number;
  page: number;
  limit: number;
};

export type PopularAuthor = AuthorModel & {
  reviewCount: number;
  borrowCount: number;
  averageBookRating: number;
  popularityScore: number;
};

export type PaginatedPopularAuthors = Omit<PaginatedAuthors, 'data'> & {
  data: PopularAuthor[];
};
