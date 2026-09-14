CREATE TYPE "BookCopyStatus" AS ENUM (
  'AVAILABLE',
  'LOANED',
  'DAMAGED',
  'LOST',
  'ARCHIVED'
);

CREATE TABLE "BookCopy" (
  "id" SERIAL NOT NULL,
  "bookId" TEXT NOT NULL,
  "barcode" TEXT NOT NULL,
  "status" "BookCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
  "shelfCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Loan" ADD COLUMN "bookCopyId" INTEGER;

CREATE UNIQUE INDEX "BookCopy_barcode_key" ON "BookCopy"("barcode");
CREATE INDEX "BookCopy_bookId_idx" ON "BookCopy"("bookId");
CREATE INDEX "BookCopy_bookId_status_idx" ON "BookCopy"("bookId", "status");
CREATE INDEX "BookCopy_status_idx" ON "BookCopy"("status");
CREATE INDEX "Loan_bookCopyId_idx" ON "Loan"("bookCopyId");

ALTER TABLE "BookCopy"
ADD CONSTRAINT "BookCopy_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_bookCopyId_fkey"
FOREIGN KEY ("bookCopyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

WITH active_counts AS (
  SELECT "bookId", COUNT(*)::INTEGER AS active_count
  FROM "Loan"
  WHERE "status" = 'ACTIVE'
  GROUP BY "bookId"
)
INSERT INTO "BookCopy" ("bookId", "barcode", "status", "createdAt", "updatedAt")
SELECT
  book."id",
  'NXR-' || UPPER(REGEXP_REPLACE(book."id", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || LPAD(series.copy_number::TEXT, 3, '0'),
  CASE
    WHEN series.copy_number <= COALESCE(active_counts.active_count, 0) THEN 'LOANED'::"BookCopyStatus"
    ELSE 'AVAILABLE'::"BookCopyStatus"
  END,
  NOW(),
  NOW()
FROM "Book" AS book
LEFT JOIN active_counts ON active_counts."bookId" = book."id"
CROSS JOIN LATERAL GENERATE_SERIES(
  1,
  GREATEST(book."totalCopies", COALESCE(active_counts.active_count, 0), 1)
) AS series(copy_number);

WITH ranked_loans AS (
  SELECT
    loan."id",
    loan."bookId",
    ROW_NUMBER() OVER (PARTITION BY loan."bookId" ORDER BY loan."borrowedAt", loan."id") AS copy_number
  FROM "Loan" AS loan
  WHERE loan."status" = 'ACTIVE'
),
ranked_copies AS (
  SELECT
    copy."id",
    copy."bookId",
    ROW_NUMBER() OVER (PARTITION BY copy."bookId" ORDER BY copy."id") AS copy_number
  FROM "BookCopy" AS copy
  WHERE copy."status" = 'LOANED'
)
UPDATE "Loan" AS loan
SET "bookCopyId" = ranked_copies."id"
FROM ranked_loans
JOIN ranked_copies
  ON ranked_copies."bookId" = ranked_loans."bookId"
 AND ranked_copies.copy_number = ranked_loans.copy_number
WHERE loan."id" = ranked_loans."id";

CREATE UNIQUE INDEX "Loan_active_bookCopyId_key"
ON "Loan"("bookCopyId")
WHERE "status" = 'ACTIVE' AND "bookCopyId" IS NOT NULL;

UPDATE "Book" AS book
SET
  "totalCopies" = inventory.total_copies,
  "availableCopies" = inventory.available_copies,
  "isAvailable" = inventory.available_copies > 0,
  "updatedAt" = NOW()
FROM (
  SELECT
    "bookId",
    COUNT(*) FILTER (WHERE "status" <> 'ARCHIVED')::INTEGER AS total_copies,
    COUNT(*) FILTER (WHERE "status" = 'AVAILABLE')::INTEGER AS available_copies
  FROM "BookCopy"
  GROUP BY "bookId"
) AS inventory
WHERE inventory."bookId" = book."id";
