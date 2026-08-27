import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Role } from '../../generated/prisma/enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';
import { toSafeUser } from './utils/to-safe-user';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      SALT_ROUNDS,
    );

    return this.usersRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: hashedPassword,
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: number) {
    return this.usersRepository.findById(id);
  }

  async findAll() {
    const users = await this.usersRepository.findAll();
    return users.map(toSafeUser);
  }

  async findOne(id: number) {
    const user = await this.findExistingOrThrow(id);
    return toSafeUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findExistingOrThrow(id);

    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email is already registered');
      }
    }

    const updated = await this.usersRepository.update(id, {
      fullName: updateUserDto.fullName,
      email: updateUserDto.email,
    });

    return toSafeUser(updated);
  }

  async updateRole(id: number, role: Role) {
    await this.findExistingOrThrow(id);
    const updated = await this.usersRepository.updateRole(id, role);
    return toSafeUser(updated);
  }

  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findExistingOrThrow(id);
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is invalid');
    }

    const password = await bcrypt.hash(
      changePasswordDto.newPassword,
      SALT_ROUNDS,
    );

    await this.usersRepository.update(id, {
      password,
      refreshTokenHash: null,
    });
  }

  updateRefreshTokenHash(id: number, refreshTokenHash: string | null) {
    return this.usersRepository.updateRefreshTokenHash(id, refreshTokenHash);
  }

  async remove(id: number) {
    await this.findExistingOrThrow(id);
    await this.usersRepository.delete(id);
  }

  private async findExistingOrThrow(id: number) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }
}
