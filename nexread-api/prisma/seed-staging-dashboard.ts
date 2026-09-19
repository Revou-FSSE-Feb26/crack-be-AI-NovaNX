import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { BookCopyStatus, LoanStatus, Role } from '../generated/prisma/enums';

const FIXTURE_PREFIX = 'staging-demo';
const SALT_ROUNDS = 10;
const COPY_COUNT_PER_BOOK = 5;

const demoBooks = [
  { id: `${FIXTURE_PREFIX}-book-01`, title: 'Dashboard Demo: Clean Code' },
  { id: `${FIXTURE_PREFIX}-book-02`, title: 'Dashboard Demo: System Design' },
  { id: `${FIXTURE_PREFIX}-book-03`, title: 'Dashboard Demo: Testing' },
  { id: `${FIXTURE_PREFIX}-book-04`, title: 'Dashboard Demo: Databases' },
  { id: `${FIXTURE_PREFIX}-book-05`, title: 'Dashboard Demo: DevOps' },
] as const;

const environmentName = (
  process.env['RAILWAY_ENVIRONMENT_NAME'] ??
  process.env['NEXREAD_ENVIRONMENT'] ??
  ''
).toLowerCase();

if (
  environmentName !== 'staging' ||
  process.env['STAGING_DASHBOARD_SEED_ENABLED'] !== 'true'
) {
  throw new Error(
    'Refusing to seed dashboard fixtures: staging environment and STAGING_DASHBOARD_SEED_ENABLED=true are required.',
  );
}

const connectionString = process.env['DATABASE_URL'];
const demoPassword = process.env['STAGING_DEMO_USER_PASSWORD'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}
if (!demoPassword || demoPassword.length < 12) {
  throw new Error(
    'STAGING_DEMO_USER_PASSWORD must contain at least 12 characters.',
  );
}
const stagingDemoPassword = demoPassword;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  const preferredAdminEmail = process.env['ADMIN_SEED_EMAIL'];
  const admin = await prisma.user.findFirst({
    where: {
      role: Role.ADMIN,
      deletedAt: null,
      ...(preferredAdminEmail ? { email: preferredAdminEmail } : {}),
    },
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
  });

  if (!admin) {
    throw new Error(
      preferredAdminEmail
        ? `Active admin ${preferredAdminEmail} was not found; no admin account was created.`
        : 'No active admin was found; no admin account was created.',
    );
  }

  const passwordHash = await bcrypt.hash(stagingDemoPassword, SALT_ROUNDS);

  await prisma.$transaction(async (transaction) => {
    const users: Array<{ id: number }> = [];
    for (let index = 1; index <= 10; index += 1) {
      const sequence = String(index).padStart(2, '0');
      users.push(
        await transaction.user.upsert({
          where: { email: `${FIXTURE_PREFIX}.user${sequence}@nexread.test` },
          update: {
            fullName: `Staging Demo User ${sequence}`,
            password: passwordHash,
            role: Role.USER,
            deletedAt: null,
            refreshTokenHash: null,
          },
          create: {
            fullName: `Staging Demo User ${sequence}`,
            email: `${FIXTURE_PREFIX}.user${sequence}@nexread.test`,
            password: passwordHash,
            role: Role.USER,
          },
          select: { id: true },
        }),
      );
    }

    await transaction.author.upsert({
      where: { id: `${FIXTURE_PREFIX}-author` },
      update: {
        name: 'Staging Dashboard Author',
        booksCount: demoBooks.length,
        borrowedBooksCount: 19,
        rating: 4.5,
        deletedAt: null,
      },
      create: {
        id: `${FIXTURE_PREFIX}-author`,
        name: 'Staging Dashboard Author',
        booksCount: demoBooks.length,
        borrowedBooksCount: 19,
        rating: 4.5,
      },
    });
    await transaction.category.upsert({
      where: { id: `${FIXTURE_PREFIX}-category` },
      update: {
        name: 'Staging Dashboard',
        slug: `${FIXTURE_PREFIX}-category`,
        subtitle: 'Staging-only dashboard KPI fixtures',
      },
      create: {
        id: `${FIXTURE_PREFIX}-category`,
        name: 'Staging Dashboard',
        slug: `${FIXTURE_PREFIX}-category`,
        subtitle: 'Staging-only dashboard KPI fixtures',
      },
    });

    for (const book of demoBooks) {
      await transaction.book.upsert({
        where: { id: book.id },
        update: {
          title: book.title,
          authorId: `${FIXTURE_PREFIX}-author`,
          categoryId: `${FIXTURE_PREFIX}-category`,
          rating: 4.5,
          description: 'Staging-only fixture for admin dashboard metrics.',
          pageCount: 240,
          totalCopies: COPY_COUNT_PER_BOOK,
          deletedAt: null,
        },
        create: {
          id: book.id,
          title: book.title,
          authorId: `${FIXTURE_PREFIX}-author`,
          categoryId: `${FIXTURE_PREFIX}-category`,
          rating: 4.5,
          description: 'Staging-only fixture for admin dashboard metrics.',
          pageCount: 240,
          totalCopies: COPY_COUNT_PER_BOOK,
          availableCopies: COPY_COUNT_PER_BOOK,
          isAvailable: true,
        },
      });
    }

    const bookIds = demoBooks.map((book) => book.id);
    const existingCopies = await transaction.bookCopy.findMany({
      where: { bookId: { in: bookIds } },
      select: { id: true },
    });
    await transaction.loan.deleteMany({ where: { bookId: { in: bookIds } } });
    await transaction.bookCopyAuditLog.deleteMany({
      where: { bookCopyId: { in: existingCopies.map((copy) => copy.id) } },
    });
    await transaction.bookCopy.deleteMany({
      where: { bookId: { in: bookIds } },
    });

    const copiesByBook: number[][] = [];
    for (const [bookIndex, book] of demoBooks.entries()) {
      const copyIds: number[] = [];
      for (
        let copyIndex = 1;
        copyIndex <= COPY_COUNT_PER_BOOK;
        copyIndex += 1
      ) {
        const status = copyStatus(bookIndex, copyIndex);
        const copy = await transaction.bookCopy.create({
          data: {
            bookId: book.id,
            barcode: `STG-DEMO-${bookIndex + 1}-${copyIndex}`,
            shelfCode: `DEMO-${bookIndex + 1}`,
            status,
          },
          select: { id: true },
        });
        copyIds.push(copy.id);
      }
      copiesByBook.push(copyIds);
    }

    const activeLoanSpecs = [
      { user: 0, book: 0, copy: 0, dueInDays: 7 },
      { user: 1, book: 1, copy: 0, dueInDays: -4 },
      { user: 2, book: 2, copy: 0, dueInDays: -2 },
      { user: 3, book: 3, copy: 0, dueInDays: 10 },
      { user: 4, book: 4, copy: 0, dueInDays: 12 },
    ];
    const requestedLoanSpecs = [
      { user: 5, book: 0, copy: 1 },
      { user: 6, book: 3, copy: 1 },
    ];

    for (const spec of activeLoanSpecs) {
      await transaction.loan.create({
        data: {
          userId: users[spec.user]!.id,
          bookId: demoBooks[spec.book]!.id,
          bookCopyId: copiesByBook[spec.book]![spec.copy],
          status: LoanStatus.ACTIVE,
          borrowedAt: daysFromNow(-10),
          dueAt: daysFromNow(spec.dueInDays),
        },
      });
    }
    for (const spec of requestedLoanSpecs) {
      await transaction.loan.create({
        data: {
          userId: users[spec.user]!.id,
          bookId: demoBooks[spec.book]!.id,
          bookCopyId: copiesByBook[spec.book]![spec.copy],
          status: LoanStatus.RETURN_REQUESTED,
          borrowedAt: daysFromNow(-8),
          dueAt: daysFromNow(6),
          returnRequestedAt: daysFromNow(-1),
        },
      });
    }

    const returnedCounts = [4, 3, 2, 1, 0];
    let returnedSequence = 0;
    for (const [bookIndex, count] of returnedCounts.entries()) {
      for (let index = 0; index < count; index += 1) {
        const user = users[(returnedSequence + 7) % users.length]!;
        const returnedAt = daysFromNow(-20 + returnedSequence);
        await transaction.loan.create({
          data: {
            userId: user.id,
            bookId: demoBooks[bookIndex]!.id,
            bookCopyId: copiesByBook[bookIndex]![4],
            status: LoanStatus.RETURNED,
            borrowedAt: daysFromNow(-35 + returnedSequence),
            dueAt: daysFromNow(-21 + returnedSequence),
            returnedAt,
            returnedByAdminId: admin.id,
          },
        });
        returnedSequence += 1;
      }
    }

    for (const [bookIndex, book] of demoBooks.entries()) {
      const statuses = await transaction.bookCopy.groupBy({
        by: ['status'],
        where: { bookId: book.id },
        _count: { _all: true },
      });
      const availableCopies =
        statuses.find((item) => item.status === BookCopyStatus.AVAILABLE)
          ?._count._all ?? 0;
      await transaction.book.update({
        where: { id: book.id },
        data: {
          availableCopies,
          isAvailable: availableCopies > 0,
          totalCopies: copiesByBook[bookIndex]!.length,
        },
      });
    }
  });

  console.log(
    `Seeded staging dashboard fixtures using existing admin ${admin.email}: 10 users, 5 books, 25 copies, and 17 loans.`,
  );
}

function copyStatus(bookIndex: number, copyIndex: number): BookCopyStatus {
  if (copyIndex <= 2 && (bookIndex === 0 || bookIndex === 3)) {
    return BookCopyStatus.LOANED;
  }
  if (copyIndex === 1 && bookIndex >= 1 && bookIndex <= 2) {
    return BookCopyStatus.LOANED;
  }
  if (copyIndex === 1 && bookIndex === 4) {
    return BookCopyStatus.LOANED;
  }
  if (copyIndex === 3 && bookIndex <= 1) {
    return BookCopyStatus.DAMAGED;
  }
  if (copyIndex === 3 && bookIndex === 2) {
    return BookCopyStatus.LOST;
  }
  if (copyIndex === 3 && (bookIndex === 3 || bookIndex === 4)) {
    return BookCopyStatus.ARCHIVED;
  }
  return BookCopyStatus.AVAILABLE;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Staging dashboard seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
