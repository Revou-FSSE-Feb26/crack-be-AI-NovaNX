import type { UserModel } from '../../../generated/prisma/models';

/**
 * Repository contract for `User` persistence.
 *
 * Services depend on this abstraction instead of `PrismaService` directly,
 * so the persistence implementation can be swapped (e.g. for tests, or a
 * different ORM/data source) without touching business logic.
 */
export abstract class UsersRepository {
  abstract create(data: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<UserModel>;
  abstract findByEmail(email: string): Promise<UserModel | null>;
  abstract findById(id: number): Promise<UserModel | null>;
}
