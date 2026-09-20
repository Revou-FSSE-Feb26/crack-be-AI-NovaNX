import { AdminService } from './admin.service';
import { AdminRepository } from './repositories/admin.repository';

describe('AdminService', () => {
  it('delegates dashboard and statistic queries to the repository', async () => {
    const repository = {
      getDashboard: jest.fn().mockResolvedValue({ totalBooks: 20 }),
      getAuthorStatistics: jest.fn().mockResolvedValue([{ author: 'A' }]),
      getCategoryStatistics: jest.fn().mockResolvedValue([{ category: 'C' }]),
    } as unknown as jest.Mocked<AdminRepository>;
    const service = new AdminService(repository);

    await expect(service.getDashboard()).resolves.toEqual({ totalBooks: 20 });
    await expect(service.getAuthorStatistics()).resolves.toEqual([
      { author: 'A' },
    ]);
    await expect(service.getCategoryStatistics()).resolves.toEqual([
      { category: 'C' },
    ]);
  });
});
