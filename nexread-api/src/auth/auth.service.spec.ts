import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { Role } from '../../generated/prisma/enums';
import type { UserModel } from '../../generated/prisma/models';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

describe('AuthService refresh tokens', () => {
  const accessSecret = 'unit-test-access-secret';
  const refreshSecret = 'unit-test-refresh-secret';
  let user: UserModel;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'findById' | 'updateRefreshTokenHash'>
  >;
  let jwtService: JwtService;
  let authService: AuthService;

  beforeEach(async () => {
    process.env.JWT_SECRET = accessSecret;
    process.env.JWT_REFRESH_SECRET = refreshSecret;
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    user = {
      id: 1,
      fullName: 'NexRead User',
      email: 'user@example.com',
      password: await bcrypt.hash('strong-password', 4),
      role: Role.USER,
      refreshTokenHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findById: jest.fn().mockImplementation(() => Promise.resolve(user)),
      updateRefreshTokenHash: jest
        .fn()
        .mockImplementation((_id: number, hash: string | null) => {
          user.refreshTokenHash = hash;
          return Promise.resolve(user);
        }),
    };
    jwtService = new JwtService({
      secret: accessSecret,
      signOptions: { expiresIn: '15m' },
    });
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
    );
  });

  it('issues access and refresh tokens with separate token types', async () => {
    const response = await authService.login(user.email, 'strong-password');
    const accessPayload = await jwtService.verifyAsync<JwtPayload>(
      response.accessToken,
      { secret: accessSecret },
    );
    const refreshPayload = await jwtService.verifyAsync<JwtPayload>(
      response.refreshToken,
      { secret: refreshSecret },
    );

    expect(accessPayload.tokenType).toBe('access');
    expect(refreshPayload.tokenType).toBe('refresh');
    expect(accessPayload.jti).toBeDefined();
    expect(refreshPayload.jti).toBeDefined();
    expect(user.refreshTokenHash).not.toBe(response.refreshToken);
    expect(user.refreshTokenHash).toBe(
      createHash('sha256').update(response.refreshToken).digest('hex'),
    );
  });

  it('rotates refresh tokens and rejects a previously used token', async () => {
    const firstPair = await authService.login(user.email, 'strong-password');
    const secondPair = await authService.refresh(firstPair.refreshToken);

    expect(secondPair.refreshToken).not.toBe(firstPair.refreshToken);
    await expect(authService.refresh(firstPair.refreshToken)).rejects.toThrow(
      'Invalid or expired refresh token',
    );
    await expect(
      authService.refresh(secondPair.refreshToken),
    ).resolves.toHaveProperty('accessToken');
  });

  it('revokes the refresh token on logout', async () => {
    const tokenPair = await authService.login(user.email, 'strong-password');

    await authService.logout(user.id);

    expect(user.refreshTokenHash).toBeNull();
    await expect(authService.refresh(tokenPair.refreshToken)).rejects.toThrow(
      'Invalid or expired refresh token',
    );
  });

  it('rejects an access token submitted as a refresh token', async () => {
    const tokenPair = await authService.login(user.email, 'strong-password');

    await expect(authService.refresh(tokenPair.accessToken)).rejects.toThrow(
      'Invalid or expired refresh token',
    );
  });

  it('uses the same generic login failure for an unknown email', async () => {
    usersService.findByEmail.mockResolvedValueOnce(null);

    await expect(
      authService.login('missing@example.com', 'strong-password'),
    ).rejects.toThrow('Invalid email or password');
  });
});
