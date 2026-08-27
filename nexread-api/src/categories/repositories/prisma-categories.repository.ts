import { Injectable } from '@nestjs/common';
import type { CategoryModel } from '../../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesRepository } from './categories.repository';

/**
 * Prisma-backed implementation of `CategoriesRepository`.
 */
@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateCategoryDto): Promise<CategoryModel> {
    return this.prisma.category.create({ data });
  }

  findAll(): Promise<CategoryModel[]> {
    return this.prisma.category.findMany();
  }

  findById(id: string): Promise<CategoryModel | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  countBooks(id: string): Promise<number> {
    return this.prisma.book.count({ where: { categoryId: id } });
  }

  update(id: string, data: UpdateCategoryDto): Promise<CategoryModel> {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<CategoryModel> {
    return this.prisma.category.delete({ where: { id } });
  }
}
