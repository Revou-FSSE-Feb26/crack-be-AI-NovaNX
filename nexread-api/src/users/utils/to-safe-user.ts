import type { UserModel } from '../../../generated/prisma/models';

export type SafeUser = Omit<UserModel, 'password' | 'refreshTokenHash'>;

/**
 * Maps a `User` record to a response-safe shape, allowlisting the fields
 * that are safe to expose instead of blacklisting `password`. This way, any
 * new sensitive field added to the model in the future is excluded by
 * default rather than accidentally leaked.
 */
export function toSafeUser(user: UserModel): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
