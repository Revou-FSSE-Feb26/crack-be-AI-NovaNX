import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/enums';
import type { UserModel } from '../../generated/prisma/models';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repository: jest.Mocked<UsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
      updateRole: jest.fn(),
      delete: jest.fn(),
    };
    service = new UsersService(repository);
  });

  it('changes a password after verifying the current password', async () => {
    const currentPassword = 'old-password';
    const user = {
      id: 1,
      fullName: 'NexRead User',
      email: 'user@example.com',
      password: await bcrypt.hash(currentPassword, 4),
      role: Role.USER,
      refreshTokenHash: 'refresh-token-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies UserModel;
    repository.findById.mockResolvedValue(user);
    repository.update.mockResolvedValue(user);

    await service.changePassword(1, {
      currentPassword,
      newPassword: 'new-password',
    });

    expect(repository.update.mock.calls).toHaveLength(1);
    const [updatedUserId, update] = repository.update.mock.calls[0];
    expect(updatedUserId).toBe(1);
    expect(update.refreshTokenHash).toBeNull();
    expect(typeof update.password).toBe('string');
    await expect(
      bcrypt.compare('new-password', update.password ?? ''),
    ).resolves.toBe(true);
  });

  it('rejects an invalid current password without updating the user', async () => {
    repository.findById.mockResolvedValue({
      id: 1,
      fullName: 'NexRead User',
      email: 'user@example.com',
      password: await bcrypt.hash('correct-password', 4),
      role: Role.USER,
      refreshTokenHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.changePassword(1, {
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.update.mock.calls).toHaveLength(0);
  });
});
