-- New section types. ADD VALUE is not usable in the same transaction, so
-- nothing below references the new values.
ALTER TYPE "SectionType" ADD VALUE 'STATS';
ALTER TYPE "SectionType" ADD VALUE 'TESTIMONIALS';
ALTER TYPE "SectionType" ADD VALUE 'FAQ';
ALTER TYPE "SectionType" ADD VALUE 'DOWNLOADS';

-- Site navigation + tagline.
ALTER TABLE "Presskit"
  ADD COLUMN "navMode" TEXT NOT NULL DEFAULT 'SCROLL',
  ADD COLUMN "showNav" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "tagline" TEXT;

-- Per-section style and layout.
ALTER TABLE "Section"
  ADD COLUMN "style" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "layout" TEXT;
