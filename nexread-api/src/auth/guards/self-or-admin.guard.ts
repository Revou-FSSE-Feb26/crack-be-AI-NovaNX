import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Allows a request only if the authenticated user is an admin, or is
 * accessing/modifying their own account (matched against the `:id` route
 * param). Must run after `JwtAuthGuard` so `request.user` is populated.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    const targetId = Number(request.params['id']);

    if (Number.isInteger(targetId) && targetId === user.userId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own account');
  }
}
