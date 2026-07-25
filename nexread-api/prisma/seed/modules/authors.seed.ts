import type { PrismaClient } from '../../../generated/prisma/client';
import { authors } from '../data/authors.data';

export async function seedAuthors(prisma: PrismaClient): Promise<void> {
  for (const author of authors) {
    await prisma.author.upsert({
      where: { id: author.id },
      update: author,
      create: author,
    });
  }

  console.log(`Seeded ${authors.length} authors`);
}
