import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedAuthors } from './seed/modules/authors.seed';
import { seedBooks } from './seed/modules/books.seed';
import { seedCategories } from './seed/modules/categories.seed';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await seedAuthors(prisma);
  await seedCategories(prisma);
  await seedBooks(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Database seed completed');
  })
  .catch(async (error: unknown) => {
    console.error('Database seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
