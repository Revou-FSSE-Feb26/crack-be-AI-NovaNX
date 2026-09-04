CREATE TYPE "AdminAuditAction" AS ENUM ('USER_ROLE_CHANGED', 'USER_DELETED');

ALTER TABLE "User"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "actorAdminId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "previousRole" "Role",
    "newRole" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_actorAdminId_idx"
ON "AdminAuditLog"("actorAdminId");

CREATE INDEX "AdminAuditLog_targetUserId_idx"
ON "AdminAuditLog"("targetUserId");

CREATE INDEX "AdminAuditLog_createdAt_idx"
ON "AdminAuditLog"("createdAt");

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_actorAdminId_fkey"
FOREIGN KEY ("actorAdminId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
