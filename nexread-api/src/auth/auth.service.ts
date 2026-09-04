import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { StringValue } from 'ms';
import type { UserModel } from '../../generated/prisma/models';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

const INVALID_USER_PASSWORD_HASH =
  '$2b$10$p9NJ2tbgVzuWmv49wbco6.SmcL01psbWlN4RbbyUVSeU28gAr0QCy';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: StringValue;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    const refreshSecret = process.env['JWT_REFRESH_SECRET'];

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    if (refreshSecret === process.env['JWT_SECRET']) {
      throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET');
    }

    this.refreshSecret = refreshSecret;
    this.refreshExpiresIn =
      (process.env['JWT_REFRESH_EXPIRES_IN'] as StringValue) ?? '7d';
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.issueTokenPair(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password ?? INVALID_USER_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isRefreshTokenValid = this.matchesRefreshToken(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.issueTokenPair(user);
  }

  async logout(userId: number): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user) {
      await this.usersService.updateRefreshTokenHash(userId, null);
    }
  }

  private async issueTokenPair(user: UserModel) {
    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        ...basePayload,
        tokenType: 'access',
        jti: randomUUID(),
      }),
      this.jwtService.signAsync(
        { ...basePayload, tokenType: 'refresh', jti: randomUUID() },
        {
          secret: this.refreshSecret,
          expiresIn: this.refreshExpiresIn,
        },
      ),
    ]);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        { secret: this.refreshSecret },
      );

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException();
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private matchesRefreshToken(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const candidateHash = Buffer.from(
      this.hashRefreshToken(refreshToken),
      'hex',
    );
    const expectedHash = Buffer.from(storedHash, 'hex');

    return (
      candidateHash.length === expectedHash.length &&
      timingSafeEqual(candidateHash, expectedHash)
    );
  }
}
