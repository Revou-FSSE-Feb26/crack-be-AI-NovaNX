import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { MeController } from './me.controller';
import { UsersService } from './users.service';

describe('MeController', () => {
  const usersService = {
    findMe: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new MeController(usersService as unknown as UsersService);
  const request = {
    user: { userId: 42, email: 'user@example.com', role: 'USER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated JWT user id for profile operations', async () => {
    const update = { fullName: 'Updated User' };

    await controller.findMe(request);
    await controller.updateMe(request, update);
    await controller.removeMe(request);

    expect(usersService.findMe).toHaveBeenCalledWith(42);
    expect(usersService.update).toHaveBeenCalledWith(42, update);
    expect(usersService.remove).toHaveBeenCalledWith(42);
  });

  it('uses the authenticated JWT user id when changing a password', async () => {
    const changePassword = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    await controller.changePassword(request, changePassword);

    expect(usersService.changePassword).toHaveBeenCalledWith(
      42,
      changePassword,
    );
  });
});
