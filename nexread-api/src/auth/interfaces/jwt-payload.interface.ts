import type { Role } from '../../../generated/prisma/enums';

export type JwtPayload = {
  sub: number;
  email: string;
  role: Role;
  tokenType: 'access' | 'refresh';
  jti: string;
};
