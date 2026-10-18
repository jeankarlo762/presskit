-- Agency (produtora) accounts: a user may own several presskits.
CREATE TYPE "AccountType" AS ENUM ('ARTIST', 'AGENCY');
CREATE TYPE "PresskitKind" AS ENUM ('ARTIST', 'AGENCY');
ALTER TYPE "ArtistCategory" ADD VALUE 'PRODUTORA';
ALTER TYPE "SectionType" ADD VALUE 'ROSTER';

ALTER TABLE "User"
  ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'ARTIST',
  ADD COLUMN "artistSeats" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Subscription" ADD COLUMN "seats" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "Presskit_userId_key";
ALTER TABLE "Presskit"
  ADD COLUMN "kind" "PresskitKind" NOT NULL DEFAULT 'ARTIST',
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "agencyId" TEXT;
CREATE INDEX "Presskit_userId_idx" ON "Presskit"("userId");
CREATE INDEX "Presskit_agencyId_idx" ON "Presskit"("agencyId");
ALTER TABLE "Presskit" ADD CONSTRAINT "Presskit_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Presskit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
