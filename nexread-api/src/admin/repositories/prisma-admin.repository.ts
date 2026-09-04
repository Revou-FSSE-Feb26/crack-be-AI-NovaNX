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
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.author.count({ where: { deletedAt: null } }),
      this.prisma.category.count(),
      this.prisma.book.count({ where: { deletedAt: null } }),
      this.prisma.book.count({
        where: { deletedAt: null, isAvailable: true },
      }),
      this.prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
      this.prisma.loan.count({
        where: { status: LoanStatus.ACTIVE, dueAt: { lt: now } },
      }),
    ]);

    const topLoanGroups = await this.prisma.loan.groupBy({
      by: ['bookId'],
      where: { book: { deletedAt: null } },
      _count: { bookId: true },
      orderBy: { _count: { bookId: 'desc' } },
      take: 5,
    });

    const topBooks = await this.prisma.book.findMany({
      where: {
        id: { in: topLoanGroups.map((item) => item.bookId) },
        deletedAt: null,
      },
      select: { id: true, title: true },
    });
    const bookById = new Map(topBooks.map((book) => [book.id, book]));

    return {
      users,
      authors,
      categories,
      books,
      availableBooks,
      activeLoans,
      overdueLoans,
      topBorrowedBooks: topLoanGroups.flatMap((item) => {
        const book = bookById.get(item.bookId);
        return book ? [{ ...book, borrowCount: item._count.bookId }] : [];
      }),
    };
  }

  async getAuthorStatistics(): Promise<AuthorStatistic[]> {
    const [authors, aggregates] = await Promise.all([
      this.prisma.author.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.book.groupBy({
        by: ['authorId'],
        where: { deletedAt: null },
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
        _count: {
          select: { books: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      booksCount: _count.books,
    }));
  }
}
