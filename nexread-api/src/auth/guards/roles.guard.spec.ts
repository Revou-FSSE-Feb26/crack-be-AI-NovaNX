import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  } as unknown as ExecutionContext;

  it('allows routes without role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('allows matching roles and rejects missing or mismatched users', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const getRequest = jest.fn();
    (context.switchToHttp as jest.Mock).mockReturnValue({ getRequest });

    getRequest.mockReturnValue({ user: { role: Role.ADMIN } });
    expect(guard.canActivate(context)).toBe(true);

    getRequest.mockReturnValue({});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

    getRequest.mockReturnValue({ user: { role: Role.USER } });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
