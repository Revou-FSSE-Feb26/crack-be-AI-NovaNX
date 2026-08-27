import type { CategoryModel } from '../../../generated/prisma/models';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';

/**
 * Repository contract for `Category` persistence.
 *
 * Services depend on this abstraction instead of `PrismaService` directly,
 * so the persistence implementation can be swapped (e.g. for tests, or a
 * different ORM/data source) without touching business logic.
 */
export abstract class CategoriesRepository {
  abstract create(data: CreateCategoryDto): Promise<CategoryModel>;
  abstract findAll(): Promise<CategoryModel[]>;
  abstract findById(id: string): Promise<CategoryModel | null>;
  abstract countBooks(id: string): Promise<number>;
  abstract update(id: string, data: UpdateCategoryDto): Promise<CategoryModel>;
  abstract delete(id: string): Promise<CategoryModel>;
}
