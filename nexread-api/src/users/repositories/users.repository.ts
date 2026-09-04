import type { Role } from '../../../generated/prisma/enums';
import type { UserModel } from '../../../generated/prisma/models';
import type { QueryUsersDto } from '../dto/query-users.dto';

export type PaginatedUsers = {
  data: UserModel[];
  total: number;
  page: number;
  limit: number;
};

export type LoanStatistics = {
  total: number;
  active: number;
  returned: number;
  overdue: number;
};

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
  abstract findAll(query?: QueryUsersDto): Promise<PaginatedUsers>;
  abstract getLoanStatistics(id: number): Promise<LoanStatistics>;
  abstract update(
    id: number,
    data: Partial<{
      fullName: string;
      email: string;
      password: string;
      refreshTokenHash: string | null;
      tokenVersion: { increment: number };
    }>,
  ): Promise<UserModel>;
  abstract updateRefreshTokenHash(
    id: number,
    refreshTokenHash: string | null,
  ): Promise<UserModel>;
  abstract countActiveAdmins(): Promise<number>;
  abstract updateRole(
    actorAdminId: number,
    id: number,
    role: Role,
  ): Promise<UserModel>;
  abstract adminDelete(actorAdminId: number, id: number): Promise<UserModel>;
  abstract delete(id: number): Promise<UserModel>;
}
