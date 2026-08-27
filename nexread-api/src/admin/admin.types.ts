export interface DashboardSummary {
  users: number;
  authors: number;
  categories: number;
  books: number;
  availableBooks: number;
  activeLoans: number;
  overdueLoans: number;
}

export interface AuthorStatistic {
  id: string;
  name: string;
  booksCount: number;
  averageBookRating: number;
}

export interface CategoryStatistic {
  id: string;
  name: string;
  slug: string;
  booksCount: number;
}
