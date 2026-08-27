# Database Query Evidence

The application uses PrismaService against PostgreSQL. These are the principal query techniques used by the API and the source that demonstrates each one.

| #   | Technique                             | API/use case                                                                                    | Implementation                                                    |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Dynamic filtering                     | Filter books by partial title, author, category, minimum rating, and availability               | `PrismaBooksRepository.findAll`                                   |
| 2   | Sorting and pagination                | Sort filtered books and return `page`, `limit`, `total`, and `totalPages` metadata              | `PrismaBooksRepository.findAll/findRecommended`                   |
| 3   | Three-table join                      | Return each book with its related author and category                                           | `PrismaBooksRepository.findAll/findById`                          |
| 4   | Nested relational query               | Return a user's loans with each book, author, and category                                      | `PrismaLoansRepository.findByUser`                                |
| 5   | Aggregation (`COUNT`)                 | Count users, authors, categories, books, available books, active loans, and overdue loans       | `PrismaAdminRepository.getDashboard`                              |
| 6   | Grouping (`GROUP BY`, `AVG`, `COUNT`) | Calculate book count and average book rating per author                                         | `PrismaAdminRepository.getAuthorStatistics`                       |
| 7   | Zero-result left-join equivalent      | List every category—including categories with no books—with its relation count                  | `PrismaAdminRepository.getCategoryStatistics`                     |
| 8   | Atomic conditional update             | Atomically decrement/increment available copies while writing the loan lifecycle                | `PrismaLoansRepository.borrow/returnLoan`                         |
| 9   | Aggregate recalculation               | Recalculate a book's average rating after review create/update/delete                           | `PrismaReviewsRepository`                                         |
| 10  | Conditional delete/soft delete        | Reject active loans, hard-delete unused books, and archive books whose history must be retained | `BooksService.remove` and `PrismaBooksRepository.deleteOrArchive` |

The application intentionally keeps these queries in Prisma-backed repositories. Services contain business rules, while controllers only handle HTTP concerns and authorization.
