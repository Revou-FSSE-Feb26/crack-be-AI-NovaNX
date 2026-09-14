import type { PrismaClient } from '../../../generated/prisma/client';
import { BookCopyStatus } from '../../../generated/prisma/enums';
import { books } from '../data/books.data';

function seedBarcode(bookId: string, copyNumber: number): string {
  const normalized = bookId.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
  return `NXR-${normalized}-${String(copyNumber).padStart(3, '0')}`;
}

export async function seedBooks(prisma: PrismaClient): Promise<void> {
  for (const book of books) {
    const seededBook = await prisma.book.upsert({
      where: { id: book.id },
      update: book,
      create: book,
    });
    const copyCount = await prisma.bookCopy.count({
      where: { bookId: book.id },
    });
    if (copyCount === 0) {
      await prisma.bookCopy.createMany({
        data: Array.from({ length: seededBook.totalCopies }, (_, index) => ({
          bookId: book.id,
          barcode: seedBarcode(book.id, index + 1),
          status: BookCopyStatus.AVAILABLE,
        })),
      });
      await prisma.book.update({
        where: { id: book.id },
        data: {
          availableCopies: seededBook.totalCopies,
          isAvailable: seededBook.totalCopies > 0,
        },
      });
    }
  }

  console.log(`Seeded ${books.length} books`);
}
