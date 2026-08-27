import { Injectable } from '@nestjs/common';
import { LoanStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthorStatistic,
  CategoryStatistic,
  DashboardSummary,
} from '../admin.types';
import { AdminRepository } from './admin.repository';

@Injectable()
export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<DashboardSummary> {
    const now = new Date();
    const [
      users,
      authors,
      categories,
      books,
      availableBooks,
      activeLoans,
      overdueLoans,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.author.count(),
      this.prisma.category.count(),
      this.prisma.book.count(),
      this.prisma.book.count({ where: { isAvailable: true } }),
      this.prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
      this.prisma.loan.count({
        where: { status: LoanStatus.ACTIVE, dueAt: { lt: now } },
      }),
    ]);

    return {
      users,
      authors,
      categories,
      books,
      availableBooks,
      activeLoans,
      overdueLoans,
    };
  }

  async getAuthorStatistics(): Promise<AuthorStatistic[]> {
    const [authors, aggregates] = await Promise.all([
      this.prisma.author.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.book.groupBy({
        by: ['authorId'],
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);
    const byAuthor = new Map(
      aggregates.map((row) => [row.authorId, row] as const),
    );

    return authors.map((author) => {
      const aggregate = byAuthor.get(author.id);
      return {
        ...author,
        booksCount: aggregate?._count._all ?? 0,
        averageBookRating: aggregate?._avg.rating ?? 0,
      };
    });
  }

  async getCategoryStatistics(): Promise<CategoryStatistic[]> {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { books: true } },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      booksCount: _count.books,
    }));
  }
}
