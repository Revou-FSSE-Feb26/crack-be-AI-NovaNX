export interface DashboardSummary {
  users: number;
  authors: number;
  categories: number;
  books: number;
  availableBooks: number;
  activeLoans: number;
  returnRequestedLoans: number;
  overdueLoans: number;
  totalPhysicalCopies: number;
  availableCopies: number;
  loanedCopies: number;
  damagedCopies: number;
  lostCopies: number;
  archivedCopies: number;
  topBorrowedBooks: TopBorrowedBook[];
}

export interface TopBorrowedBook {
  id: string;
  title: string;
  borrowCount: number;
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
