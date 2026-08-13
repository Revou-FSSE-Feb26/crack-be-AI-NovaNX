import { Injectable } from '@nestjs/common';
import type { Role } from '../../../generated/prisma/enums';
import type { UserModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';

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
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  update(
    id: number,
    data: Partial<{
      fullName: string;
      email: string;
      password: string;
      refreshTokenHash: string | null;
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

  updateRole(id: number, role: Role): Promise<UserModel> {
    return this.prisma.user.update({
      where: { id },
      data: { role, refreshTokenHash: null },
    });
  }

  delete(id: number): Promise<UserModel> {
    return this.prisma.user.delete({ where: { id } });
  }
}
