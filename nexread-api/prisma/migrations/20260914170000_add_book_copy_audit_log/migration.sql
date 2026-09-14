CREATE TABLE "BookCopyAuditLog" (
  "id" SERIAL NOT NULL,
  "bookCopyId" INTEGER NOT NULL,
  "actorAdminId" INTEGER NOT NULL,
  "previousStatus" "BookCopyStatus" NOT NULL,
  "newStatus" "BookCopyStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookCopyAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookCopyAuditLog_bookCopyId_createdAt_idx"
ON "BookCopyAuditLog"("bookCopyId", "createdAt");

CREATE INDEX "BookCopyAuditLog_actorAdminId_idx"
ON "BookCopyAuditLog"("actorAdminId");

ALTER TABLE "BookCopyAuditLog"
ADD CONSTRAINT "BookCopyAuditLog_bookCopyId_fkey"
FOREIGN KEY ("bookCopyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookCopyAuditLog"
ADD CONSTRAINT "BookCopyAuditLog_actorAdminId_fkey"
FOREIGN KEY ("actorAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
