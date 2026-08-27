-- Add availability and the loan lifecycle used by borrow/return operations.
ALTER TABLE "Book"
ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'RETURNED');

CREATE TABLE "Loan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Loan_dueAt_after_borrowedAt_check" CHECK ("dueAt" > "borrowedAt"),
    CONSTRAINT "Loan_returnedAt_after_borrowedAt_check" CHECK ("returnedAt" IS NULL OR "returnedAt" >= "borrowedAt")
);

CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");
CREATE INDEX "Loan_bookId_idx" ON "Loan"("bookId");
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- Only one active loan may exist for a book, while historical returned loans
-- remain unrestricted. PostgreSQL partial indexes are intentionally expressed
-- in SQL because Prisma schema syntax cannot represent them.
CREATE UNIQUE INDEX "Loan_one_active_per_book_key"
ON "Loan"("bookId")
WHERE "status" = 'ACTIVE';

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants are enforced in the database in addition to DTO checks.
ALTER TABLE "Author"
ADD CONSTRAINT "Author_booksCount_nonnegative_check" CHECK ("booksCount" >= 0),
ADD CONSTRAINT "Author_borrowedBooksCount_nonnegative_check" CHECK ("borrowedBooksCount" >= 0),
ADD CONSTRAINT "Author_rating_range_check" CHECK ("rating" >= 0 AND "rating" <= 5);

ALTER TABLE "Book"
ADD CONSTRAINT "Book_rating_range_check" CHECK ("rating" >= 0 AND "rating" <= 5);
