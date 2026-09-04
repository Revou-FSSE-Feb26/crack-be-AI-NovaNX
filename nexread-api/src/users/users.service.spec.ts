import { ConflictException, UnauthorizedException } from '@nestjs/common';
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
      getLoanStatistics: jest.fn(),
      update: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
      countActiveAdmins: jest.fn(),
      updateRole: jest.fn(),
      adminDelete: jest.fn(),
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
      tokenVersion: 0,
      deletedAt: null,
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
    expect(update.tokenVersion).toEqual({ increment: 1 });
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
      tokenVersion: 0,
      deletedAt: null,
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

  it('prevents an administrator from demoting themselves', async () => {
    repository.findById.mockResolvedValue({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      password: 'hash',
      role: Role.ADMIN,
      refreshTokenHash: null,
      tokenVersion: 0,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.updateRole(1, 1, Role.USER)).rejects.toThrow(
      ConflictException,
    );
    expect(repository.updateRole.mock.calls).toHaveLength(0);
  });

  it('prevents demoting the last active administrator', async () => {
    repository.findById.mockResolvedValue({
      id: 2,
      fullName: 'Last Admin',
      email: 'last-admin@example.com',
      password: 'hash',
      role: Role.ADMIN,
      refreshTokenHash: null,
      tokenVersion: 0,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.countActiveAdmins.mockResolvedValue(1);

    await expect(service.updateRole(1, 2, Role.USER)).rejects.toThrow(
      'The last administrator cannot be demoted',
    );
    expect(repository.updateRole.mock.calls).toHaveLength(0);
  });

  it('prevents an administrator from deleting themselves', async () => {
    repository.findById.mockResolvedValue({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      password: 'hash',
      role: Role.ADMIN,
      refreshTokenHash: null,
      tokenVersion: 0,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.adminRemove(1, 1)).rejects.toThrow(
      'Administrators cannot delete themselves',
    );
    expect(repository.adminDelete.mock.calls).toHaveLength(0);
  });

  it('prevents deleting the last active administrator', async () => {
    repository.findById.mockResolvedValue({
      id: 2,
      fullName: 'Last Admin',
      email: 'last-admin@example.com',
      password: 'hash',
      role: Role.ADMIN,
      refreshTokenHash: null,
      tokenVersion: 0,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.countActiveAdmins.mockResolvedValue(1);

    await expect(service.adminRemove(1, 2)).rejects.toThrow(
      'The last administrator cannot be deleted',
    );
    expect(repository.adminDelete.mock.calls).toHaveLength(0);
  });
});
