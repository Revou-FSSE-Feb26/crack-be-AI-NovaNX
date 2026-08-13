import { Injectable } from '@nestjs/common';
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
}
