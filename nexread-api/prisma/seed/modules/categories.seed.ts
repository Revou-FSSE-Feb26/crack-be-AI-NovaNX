import type { PrismaClient } from '../../../generated/prisma/client';
import { categories } from '../data/categories.data';

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}
