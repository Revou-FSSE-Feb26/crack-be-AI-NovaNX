-- Track inventory per title while keeping isAvailable for backward-compatible
-- API responses. Existing active loans are used to initialize availability.
ALTER TABLE "Book"
ADD COLUMN "totalCopies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "availableCopies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Book" AS book
SET "availableCopies" = CASE
  WHEN EXISTS (
    SELECT 1 FROM "Loan"
    WHERE "Loan"."bookId" = book."id" AND "Loan"."status" = 'ACTIVE'
  ) THEN 0 ELSE 1 END,
    "isAvailable" = NOT EXISTS (
    SELECT 1 FROM "Loan"
    WHERE "Loan"."bookId" = book."id" AND "Loan"."status" = 'ACTIVE'
  );

DROP INDEX "Loan_one_active_per_book_key";

ALTER TABLE "Book"
ADD CONSTRAINT "Book_totalCopies_positive_check" CHECK ("totalCopies" > 0),
ADD CONSTRAINT "Book_availableCopies_range_check" CHECK ("availableCopies" >= 0 AND "availableCopies" <= "totalCopies"),
ADD CONSTRAINT "Book_availability_consistent_check" CHECK ("isAvailable" = ("availableCopies" > 0));

CREATE INDEX "Book_deletedAt_idx" ON "Book"("deletedAt");

CREATE TABLE "Review" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "bookId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Review_rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE UNIQUE INDEX "Review_userId_bookId_key" ON "Review"("userId", "bookId");
CREATE INDEX "Review_bookId_idx" ON "Review"("bookId");

ALTER TABLE "Review"
ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
