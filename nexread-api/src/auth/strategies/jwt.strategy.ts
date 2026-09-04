import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    const secret = process.env['JWT_SECRET'];

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (
      !user ||
      user.email !== payload.email ||
      user.role !== payload.role ||
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException('Access token is no longer valid');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
