# Database Query Evidence

The application uses PrismaService against PostgreSQL. These are the principal query techniques used by the API and the source that demonstrates each one.

| #   | Technique                             | API/use case                                                                                                                | Implementation                                                                                     |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Dynamic filtering                     | Filter books by partial title, author, category, minimum rating, and availability                                           | `PrismaBooksRepository.findAll`                                                                    |
| 2   | Sorting                               | Sort filtered books by title, rating, or creation time, ascending or descending                                             | `PrismaBooksRepository.findAll`                                                                    |
| 3   | Three-table join                      | Return each book with its related author and category                                                                       | `PrismaBooksRepository.findAll/findById`                                                           |
| 4   | Nested relational query               | Return a user's loans with each book, author, and category                                                                  | `PrismaLoansRepository.findByUser`                                                                 |
| 5   | Aggregation (`COUNT`)                 | Count users, authors, categories, books, available books, active loans, and overdue loans                                   | `PrismaAdminRepository.getDashboard`                                                               |
| 6   | Grouping (`GROUP BY`, `AVG`, `COUNT`) | Calculate book count and average book rating per author                                                                     | `PrismaAdminRepository.getAuthorStatistics`                                                        |
| 7   | Zero-result left-join equivalent      | List every category—including categories with no books—with its relation count                                              | `PrismaAdminRepository.getCategoryStatistics`                                                      |
| 8   | Atomic conditional update             | Reserve/return a book and write its loan inside a transaction; a partial unique index permits only one active loan per book | `PrismaLoansRepository.borrow/returnLoan` and migration `20260827080000_add_loans_and_constraints` |

The application intentionally keeps these queries in Prisma-backed repositories. Services contain business rules, while controllers only handle HTTP concerns and authorization.
