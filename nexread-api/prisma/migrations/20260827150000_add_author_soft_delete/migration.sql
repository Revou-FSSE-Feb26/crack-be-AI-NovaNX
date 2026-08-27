ALTER TABLE "Author"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Author_deletedAt_idx" ON "Author"("deletedAt");
