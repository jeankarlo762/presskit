-- Video files uploaded by the artist (Mídia page), next to YouTube/Vimeo links.
ALTER TYPE "MediaProvider" ADD VALUE 'UPLOAD';
ALTER TABLE "MediaEmbed" ADD COLUMN "storageKey" TEXT;
