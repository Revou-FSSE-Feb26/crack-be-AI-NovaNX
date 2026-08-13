import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '../../../generated/prisma/client';
import { Role } from '../../../generated/prisma/enums';

const SALT_ROUNDS = 10;

/**
 * Seeds a single admin account, sourced entirely from environment
 * variables. Intentionally does NOT ship a hardcoded default email/password:
 * a predictable default admin credential is a real vulnerability if a
 * deployment forgets to change it. If the variables are not set, the admin
 * seed step is skipped (with a warning) instead of falling back to an
 * insecure default.
 */
export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const email = process.env['ADMIN_SEED_EMAIL'];
  const password = process.env['ADMIN_SEED_PASSWORD'];

  if (!email || !password) {
    console.warn(
      'Skipping admin user seed: set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in the environment to create/promote an admin account.',
    );
    return;
  }

  if (password.length < 8) {
    console.warn(
      'Skipping admin user seed: ADMIN_SEED_PASSWORD must be at least 8 characters.',
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      refreshTokenHash: null,
    },
    create: {
      fullName: 'NexRead Admin',
      email,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin user (${email})`);
}
