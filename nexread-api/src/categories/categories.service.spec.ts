import { ConflictException } from '@nestjs/common';
import type { CategoryModel } from '../../generated/prisma/models';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';

const category: CategoryModel = {
  id: 'fiction',
  name: 'Fiction',
  slug: 'fiction',
  subtitle: null,
  iconPath: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CategoriesService', () => {
  it('rejects deletion while visible books remain', async () => {
    const repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(category),
      countBooks: jest.fn().mockResolvedValue(1),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<CategoriesRepository>;
    const service = new CategoriesService(repository);

    await expect(service.remove(category.id)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.delete.mock.calls).toHaveLength(0);
  });
});
