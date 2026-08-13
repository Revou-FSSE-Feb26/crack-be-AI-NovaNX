-- Store only a one-way hash so a database leak does not expose usable
-- refresh tokens. A nullable value represents a logged-out/revoked session.
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT;
