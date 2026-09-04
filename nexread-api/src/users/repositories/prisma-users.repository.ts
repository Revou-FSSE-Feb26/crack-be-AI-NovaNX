import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  LoanStatus,
  Role,
} from '../../../generated/prisma/enums';
import type { UserModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryUsersDto } from '../dto/query-users.dto';
import {
  UsersRepository,
  type LoanStatistics,
  type PaginatedUsers,
} from './users.repository';

/**
 * Prisma-backed implementation of `UsersRepository`.
 */
@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findById(id: number): Promise<UserModel | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findAll(query: QueryUsersDto = {}): Promise<PaginatedUsers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getLoanStatistics(id: number): Promise<LoanStatistics> {
    const now = new Date();
    const [total, active, returned, overdue] = await this.prisma.$transaction([
      this.prisma.loan.count({ where: { userId: id } }),
      this.prisma.loan.count({
        where: { userId: id, status: LoanStatus.ACTIVE },
      }),
      this.prisma.loan.count({
        where: { userId: id, status: LoanStatus.RETURNED },
      }),
      this.prisma.loan.count({
        where: {
          userId: id,
          status: LoanStatus.ACTIVE,
          dueAt: { lt: now },
        },
      }),
    ]);
    return { total, active, returned, overdue };
  }

  update(
    id: number,
    data: Partial<{
      fullName: string;
      email: string;
      password: string;
      refreshTokenHash: string | null;
      tokenVersion: { increment: number };
    }>,
  ): Promise<UserModel> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateRefreshTokenHash(
    id: number,
    refreshTokenHash: string | null,
  ): Promise<UserModel> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: { role: Role.ADMIN, deletedAt: null },
    });
  }

  updateRole(actorAdminId: number, id: number, role: Role): Promise<UserModel> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(71928401::bigint)`;
      const user = await transaction.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException(`User with id "${id}" not found`);
      }

      if (
        actorAdminId === id &&
        user.role === Role.ADMIN &&
        role !== Role.ADMIN
      ) {
        throw new ConflictException('Administrators cannot demote themselves');
      }

      if (user.role === Role.ADMIN && role !== Role.ADMIN) {
        const activeAdmins = await transaction.user.count({
          where: { role: Role.ADMIN, deletedAt: null },
        });
        if (activeAdmins <= 1) {
          throw new ConflictException(
            'The last administrator cannot be demoted',
          );
        }
      }

      const updated = await transaction.user.update({
        where: { id },
        data: {
          role,
          refreshTokenHash: null,
          tokenVersion: { increment: 1 },
        },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorAdminId,
          targetUserId: id,
          action: AdminAuditAction.USER_ROLE_CHANGED,
          previousRole: user.role,
          newRole: role,
        },
      });
      return updated;
    });
  }

  adminDelete(actorAdminId: number, id: number): Promise<UserModel> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(71928401::bigint)`;
      const user = await transaction.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException(`User with id "${id}" not found`);
      }
      if (actorAdminId === id) {
        throw new ConflictException('Administrators cannot delete themselves');
      }
      if (user.role === Role.ADMIN) {
        const activeAdmins = await transaction.user.count({
          where: { role: Role.ADMIN, deletedAt: null },
        });
        if (activeAdmins <= 1) {
          throw new ConflictException(
            'The last administrator cannot be deleted',
          );
        }
      }

      const deleted = await transaction.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          refreshTokenHash: null,
          tokenVersion: { increment: 1 },
        },
      });
      await transaction.cartItem.deleteMany({ where: { userId: id } });
      await transaction.adminAuditLog.create({
        data: {
          actorAdminId,
          targetUserId: id,
          action: AdminAuditAction.USER_DELETED,
          previousRole: user.role,
        },
      });
      return deleted;
    });
  }

  delete(id: number): Promise<UserModel> {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findFirst({
        where: { id, deletedAt: null },
      });
      if (!user) {
        throw new NotFoundException(`User with id "${id}" not found`);
      }
      if (user.role === Role.ADMIN) {
        throw new ConflictException(
          'Administrators cannot delete their own account',
        );
      }
      const deleted = await transaction.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          refreshTokenHash: null,
          tokenVersion: { increment: 1 },
        },
      });
      await transaction.cartItem.deleteMany({ where: { userId: id } });
      return deleted;
    });
  }
}
