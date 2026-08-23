-- CreateEnum
CREATE TYPE "PlanKey" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ArtistCategory" AS ENUM ('MUSICO_BANDA', 'DJ', 'ATOR', 'ARTISTA_VISUAL');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('BIO', 'MUSIC', 'VIDEO', 'GALLERY', 'PRESS', 'TOUR_DATES', 'CONTACT', 'TECH_RIDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('SPOTIFY', 'YOUTUBE', 'SOUNDCLOUD', 'VIMEO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planKey" "PlanKey" NOT NULL DEFAULT 'FREE',
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presskit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ArtistCategory" NOT NULL,
    "templateKey" TEXT NOT NULL DEFAULT 'default',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "state" TEXT,
    "ogTitleOverride" TEXT,
    "ogDescriptionOverride" TEXT,
    "themeBackgroundColor" TEXT NOT NULL DEFAULT '#0a0a0a',
    "themeTextColor" TEXT NOT NULL DEFAULT '#fafafa',
    "themeAccentColor" TEXT NOT NULL DEFAULT '#f43f5e',
    "themeFontKey" TEXT NOT NULL DEFAULT 'inter',
    "themeBackgroundImageUrl" TEXT,
    "themeBackgroundImageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presskit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugHistory" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEmbed" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "provider" "MediaProvider" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MediaEmbed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "caption" TEXT,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDate" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "venueName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "ticketUrl" TEXT,

    CONSTRAINT "TourDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressMention" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "outlet" TEXT NOT NULL,
    "quote" TEXT,
    "url" TEXT,
    "logoUrl" TEXT,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "PressMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackableLink" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackableLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "presskitId" TEXT NOT NULL,
    "trackableLinkId" TEXT,
    "sessionId" TEXT NOT NULL,
    "referrerUrl" TEXT,
    "referrerHost" TEXT,
    "deviceType" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsaasWebhookEvent" (
    "id" TEXT NOT NULL,
    "asaasEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsaasWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Presskit_userId_key" ON "Presskit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Presskit_slug_key" ON "Presskit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SlugHistory_oldSlug_key" ON "SlugHistory"("oldSlug");

-- CreateIndex
CREATE INDEX "Section_presskitId_idx" ON "Section"("presskitId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_presskitId_type_key" ON "Section"("presskitId", "type");

-- CreateIndex
CREATE INDEX "MediaEmbed_presskitId_idx" ON "MediaEmbed"("presskitId");

-- CreateIndex
CREATE INDEX "GalleryPhoto_presskitId_idx" ON "GalleryPhoto"("presskitId");

-- CreateIndex
CREATE INDEX "TourDate_presskitId_idx" ON "TourDate"("presskitId");

-- CreateIndex
CREATE INDEX "PressMention_presskitId_idx" ON "PressMention"("presskitId");

-- CreateIndex
CREATE INDEX "TrackableLink_presskitId_idx" ON "TrackableLink"("presskitId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackableLink_presskitId_code_key" ON "TrackableLink"("presskitId", "code");

-- CreateIndex
CREATE INDEX "PageView_presskitId_createdAt_idx" ON "PageView"("presskitId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_presskitId_trackableLinkId_idx" ON "PageView"("presskitId", "trackableLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "AsaasWebhookEvent_asaasEventId_key" ON "AsaasWebhookEvent"("asaasEventId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presskit" ADD CONSTRAINT "Presskit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlugHistory" ADD CONSTRAINT "SlugHistory_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEmbed" ADD CONSTRAINT "MediaEmbed_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDate" ADD CONSTRAINT "TourDate_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressMention" ADD CONSTRAINT "PressMention_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackableLink" ADD CONSTRAINT "TrackableLink_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_presskitId_fkey" FOREIGN KEY ("presskitId") REFERENCES "Presskit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_trackableLinkId_fkey" FOREIGN KEY ("trackableLinkId") REFERENCES "TrackableLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
