import type { PrismaClient } from '../../../generated/prisma/client';
import { books } from '../data/books.data';

export async function seedBooks(prisma: PrismaClient): Promise<void> {
  for (const book of books) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: book,
      create: book,
    });
  }

  console.log(`Seeded ${books.length} books`);
}
