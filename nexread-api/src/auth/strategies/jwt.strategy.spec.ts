import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env['JWT_SECRET'];

  afterEach(() => {
    if (originalSecret === undefined) delete process.env['JWT_SECRET'];
    else process.env['JWT_SECRET'] = originalSecret;
  });

  it('requires JWT_SECRET', () => {
    delete process.env['JWT_SECRET'];
    expect(() => new JwtStrategy({} as UsersService)).toThrow(
      'JWT_SECRET is not defined',
    );
  });

  it('validates current access-token claims', async () => {
    process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters';
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        role: Role.USER,
        tokenVersion: 2,
      }),
    } as unknown as UsersService;
    const strategy = new JwtStrategy(users);
    const payload = {
      jti: 'token-id',
      sub: 1,
      email: 'user@example.com',
      role: Role.USER,
      tokenVersion: 2,
      tokenType: 'access' as const,
    };

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 1,
      email: 'user@example.com',
      role: Role.USER,
    });
  });

  it('rejects refresh tokens and stale user claims', async () => {
    process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters';
    const users = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as UsersService;
    const strategy = new JwtStrategy(users);
    const payload = {
      jti: 'token-id',
      sub: 1,
      email: 'user@example.com',
      role: Role.USER,
      tokenVersion: 0,
      tokenType: 'access' as const,
    };

    await expect(
      strategy.validate({ ...payload, tokenType: 'refresh' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
