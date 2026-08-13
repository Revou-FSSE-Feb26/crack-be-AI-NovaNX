import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedAdminUser } from './seed/modules/users.seed';

/**
 * Standalone entry point that seeds ONLY the admin user, without touching
 * Authors/Categories/Books. Use this against environments (e.g. production)
 * where the catalog data has already been seeded once, since seedAuthors/
 * seedCategories/seedBooks use non-idempotent create() calls and would fail
 * on unique constraints if re-run — this script avoids that entirely.
 */
const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

seedAdminUser(prisma)
  .then(async () => {
    await prisma.$disconnect();
    console.log('Admin user seed completed');
  })
  .catch(async (error: unknown) => {
    console.error('Admin user seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
