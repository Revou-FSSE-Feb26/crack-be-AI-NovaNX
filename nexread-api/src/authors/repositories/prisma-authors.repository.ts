import { Injectable } from '@nestjs/common';
import type { AuthorModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAuthorDto } from '../dto/create-author.dto';
import type { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorsRepository } from './authors.repository';

/**
 * Prisma-backed implementation of `AuthorsRepository`.
 */
@Injectable()
export class PrismaAuthorsRepository implements AuthorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAuthorDto): Promise<AuthorModel> {
    return this.prisma.author.create({ data });
  }

  findAll(): Promise<AuthorModel[]> {
    return this.prisma.author.findMany();
  }

  findById(id: string): Promise<AuthorModel | null> {
    return this.prisma.author.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateAuthorDto): Promise<AuthorModel> {
    return this.prisma.author.update({ where: { id }, data });
  }

  delete(id: string): Promise<AuthorModel> {
    return this.prisma.author.delete({ where: { id } });
  }
}
