import type { AuthorModel } from '../../../generated/prisma/models';
import type { CreateAuthorDto } from '../dto/create-author.dto';
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
  abstract findAll(): Promise<AuthorModel[]>;
  abstract findById(id: string): Promise<AuthorModel | null>;
  abstract update(id: string, data: UpdateAuthorDto): Promise<AuthorModel>;
  abstract delete(id: string): Promise<AuthorModel>;
}
