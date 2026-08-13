import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. Must be combined with `JwtAuthGuard`
 * (to populate `request.user`) and `RolesGuard` (to enforce the check).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
