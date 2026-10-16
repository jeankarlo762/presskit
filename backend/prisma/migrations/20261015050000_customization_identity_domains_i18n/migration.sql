-- Presskit: background fine-tuning, identity images, hero video, WhatsApp,
-- quick links, languages, artist custom domain.
ALTER TABLE "Presskit"
  ADD COLUMN "themeBackgroundOverlay" INTEGER NOT NULL DEFAULT 55,
  ADD COLUMN "themeBackgroundBlur" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "themeBackgroundPosition" TEXT NOT NULL DEFAULT 'center',
  ADD COLUMN "themeBackgroundAttachment" TEXT NOT NULL DEFAULT 'FIXED',
  ADD COLUMN "themeBackgroundRepeat" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "themeBackgroundPreset" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "coverImageKey" TEXT,
  ADD COLUMN "avatarImageUrl" TEXT,
  ADD COLUMN "avatarImageKey" TEXT,
  ADD COLUMN "logoImageUrl" TEXT,
  ADD COLUMN "logoImageKey" TEXT,
  ADD COLUMN "heroVideoUrl" TEXT,
  ADD COLUMN "whatsappNumber" TEXT,
  ADD COLUMN "whatsappMessage" TEXT,
  ADD COLUMN "quickLinks" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "languages" TEXT[] DEFAULT ARRAY['pt']::TEXT[],
  ADD COLUMN "customDomain" TEXT,
  ADD COLUMN "customDomainStatus" TEXT NOT NULL DEFAULT 'NONE';

CREATE UNIQUE INDEX "Presskit_customDomain_key" ON "Presskit"("customDomain");

-- Section: English variants.
ALTER TABLE "Section"
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "dataEn" JSONB;

-- Conversion clicks on the public page.
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LinkClick_presskitId_createdAt_idx" ON "LinkClick"("presskitId", "createdAt");

ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
