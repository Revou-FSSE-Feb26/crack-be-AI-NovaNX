import type {
  AuthorStatistic,
  CategoryStatistic,
  DashboardSummary,
} from '../admin.types';

export abstract class AdminRepository {
  abstract getDashboard(): Promise<DashboardSummary>;
  abstract getAuthorStatistics(): Promise<AuthorStatistic[]>;
  abstract getCategoryStatistics(): Promise<CategoryStatistic[]>;
}
