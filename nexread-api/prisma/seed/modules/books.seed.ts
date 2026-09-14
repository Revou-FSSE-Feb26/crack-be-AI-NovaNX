import type { PrismaClient } from '../../../generated/prisma/client';
import { BookCopyStatus } from '../../../generated/prisma/enums';
import { books } from '../data/books.data';

function seedBarcode(copyNumber: number): string {
  return `BK-${String(copyNumber).padStart(3, '0')}`;
}

export async function seedBooks(prisma: PrismaClient): Promise<void> {
  const prototypeCopies = await prisma.bookCopy.findMany({
    where: { barcode: { startsWith: 'BK-' } },
    select: { barcode: true },
  });
  let nextBarcodeNumber =
    Math.max(
      0,
      ...prototypeCopies.map((copy) => {
        const match = /^BK-(\d+)$/.exec(copy.barcode);
        return match ? Number(match[1]) : 0;
      }),
    ) + 1;

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
        data: Array.from({ length: seededBook.totalCopies }, () => ({
          bookId: book.id,
          barcode: seedBarcode(nextBarcodeNumber++),
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
