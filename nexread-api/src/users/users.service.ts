import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
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

  async findAll(query: QueryUsersDto) {
    const result = await this.usersRepository.findAll(query);
    return {
      data: result.data.map(toSafeUser),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.findExistingOrThrow(id);
    return toSafeUser(user);
  }

  async findMe(id: number) {
    const user = await this.findExistingOrThrow(id);
    return {
      ...toSafeUser(user),
      loanStatistics: await this.usersRepository.getLoanStatistics(id),
    };
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
      tokenVersion: updateUserDto.email ? { increment: 1 } : undefined,
    });

    return toSafeUser(updated);
  }

  async updateRole(actorAdminId: number, id: number, role: Role) {
    const user = await this.findExistingOrThrow(id);
    if (user.role === role) {
      return toSafeUser(user);
    }
    if (actorAdminId === id && user.role !== role) {
      throw new ConflictException('Administrators cannot demote themselves');
    }
    if (
      user.role === Role.ADMIN &&
      role !== Role.ADMIN &&
      (await this.usersRepository.countActiveAdmins()) <= 1
    ) {
      throw new ConflictException('The last administrator cannot be demoted');
    }
    const updated = await this.usersRepository.updateRole(
      actorAdminId,
      id,
      role,
    );
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
      tokenVersion: { increment: 1 },
    });
  }

  updateRefreshTokenHash(id: number, refreshTokenHash: string | null) {
    return this.usersRepository.updateRefreshTokenHash(id, refreshTokenHash);
  }

  async remove(id: number) {
    await this.findExistingOrThrow(id);
    await this.usersRepository.delete(id);
  }

  async adminRemove(actorAdminId: number, id: number) {
    const user = await this.findExistingOrThrow(id);
    if (actorAdminId === id) {
      throw new ConflictException('Administrators cannot delete themselves');
    }
    if (
      user.role === Role.ADMIN &&
      (await this.usersRepository.countActiveAdmins()) <= 1
    ) {
      throw new ConflictException('The last administrator cannot be deleted');
    }
    await this.usersRepository.adminDelete(actorAdminId, id);
  }

  private async findExistingOrThrow(id: number) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }
}
