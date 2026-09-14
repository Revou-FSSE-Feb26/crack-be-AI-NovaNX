ALTER TYPE "LoanStatus" ADD VALUE 'RETURN_REQUESTED' BEFORE 'RETURNED';

ALTER TABLE "Loan"
ADD COLUMN "returnRequestedAt" TIMESTAMP(3),
ADD COLUMN "returnedByAdminId" INTEGER;

CREATE INDEX "Loan_returnedByAdminId_idx" ON "Loan"("returnedByAdminId");

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_returnedByAdminId_fkey"
FOREIGN KEY ("returnedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "Loan_active_bookCopyId_key";

CREATE UNIQUE INDEX "Loan_unreturned_bookCopyId_key"
ON "Loan"("bookCopyId")
WHERE "status" IN ('ACTIVE', 'RETURN_REQUESTED') AND "bookCopyId" IS NOT NULL;
