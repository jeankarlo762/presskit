import { prisma } from "../../config/prisma";
import {
  requireWithinUploadedVideoLimit,
  type MediaEmbedCreateInput,
  type MediaEmbedPatchInput,
  type PlanKey,
} from "@presskit/shared";
import {
  assertOwnedStorageKey,
  assertVideoObjectExists,
  createVideoUploadUrl,
  deleteImageObject,
  publicUrlFor,
} from "../../shared/storage.service";

export async function listMediaEmbeds(presskitId: string) {
  return prisma.mediaEmbed.findMany({ where: { presskitId }, orderBy: { order: "asc" } });
}

export async function createMediaEmbed(presskitId: string, input: MediaEmbedCreateInput) {
  const last = await prisma.mediaEmbed.findFirst({ where: { presskitId }, orderBy: { order: "desc" } });
  return prisma.mediaEmbed.create({
    data: { presskitId, ...input, order: (last?.order ?? -1) + 1 },
  });
}

export async function requestVideoUpload(presskitId: string, plan: PlanKey, extension: string) {
  const currentCount = await prisma.mediaEmbed.count({ where: { presskitId, provider: "UPLOAD" } });
  requireWithinUploadedVideoLimit(plan, currentCount);
  return createVideoUploadUrl(presskitId, extension);
}

export async function confirmUploadedVideo(
  presskitId: string,
  plan: PlanKey,
  input: { storageKey: string; title?: string },
) {
  assertOwnedStorageKey(presskitId, "videos", input.storageKey);
  // Presigned URLs can be requested in bulk; the row count only moves here.
  const currentCount = await prisma.mediaEmbed.count({ where: { presskitId, provider: "UPLOAD" } });
  requireWithinUploadedVideoLimit(plan, currentCount);
  await assertVideoObjectExists(input.storageKey);

  const last = await prisma.mediaEmbed.findFirst({ where: { presskitId }, orderBy: { order: "desc" } });
  return prisma.mediaEmbed.create({
    data: {
      presskitId,
      provider: "UPLOAD",
      storageKey: input.storageKey,
      url: publicUrlFor(input.storageKey),
      title: input.title || null,
      order: (last?.order ?? -1) + 1,
    },
  });
}

export class MediaEmbedNotFoundError extends Error {
  constructor() {
    super("Mídia não encontrada");
    this.name = "MediaEmbedNotFoundError";
  }
}

export async function updateMediaEmbed(presskitId: string, id: string, input: MediaEmbedPatchInput) {
  const existing = await prisma.mediaEmbed.findFirst({ where: { id, presskitId } });
  if (!existing) throw new MediaEmbedNotFoundError();
  // An uploaded video's link points at its own file: only the title moves.
  const data = existing.provider === "UPLOAD" ? { title: input.title } : input;
  return prisma.mediaEmbed.update({ where: { id }, data });
}

export async function deleteMediaEmbed(presskitId: string, id: string) {
  const existing = await prisma.mediaEmbed.findFirst({ where: { id, presskitId } });
  if (!existing) return;
  await prisma.mediaEmbed.delete({ where: { id: existing.id } });
  if (existing.storageKey) await deleteImageObject(existing.storageKey);
}
