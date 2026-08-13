import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Role } from '../../generated/prisma/enums';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.buildAuthResponse(
      user.id,
      user.email,
      user.fullName,
      user.role,
    );
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.fullName,
      user.role,
    );
  }

  private buildAuthResponse(
    userId: number,
    email: string,
    fullName: string,
    role: Role,
  ) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });

    return {
      accessToken,
      user: {
        id: userId,
        fullName,
        email,
        role,
      },
    };
  }
}
