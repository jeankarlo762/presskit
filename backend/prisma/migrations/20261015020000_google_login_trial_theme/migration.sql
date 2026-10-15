-- Google sign-in: accounts created through Google may have no password.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- Free PRO trial. The column is added without a default first so accounts
-- that already exist stay NULL (no retroactive trial); only rows inserted
-- after this migration get now() + 14 days.
ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "trialEndsAt" SET DEFAULT (now() + '14 days'::interval);

-- Public page customization.
ALTER TABLE "Presskit" ADD COLUMN "themeHeadingFontKey" TEXT;
ALTER TABLE "Presskit" ADD COLUMN "themeButtonStyle" TEXT NOT NULL DEFAULT 'ROUNDED';
