import type { Request } from 'express';
import type { Role } from '../../../generated/prisma/enums';

export type AuthenticatedUser = {
  userId: number;
  email: string;
  role: Role;
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
