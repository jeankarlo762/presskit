import { prisma } from "../../config/prisma";
import type { MediaEmbedInput } from "@presskit/shared";

export async function listMediaEmbeds(presskitId: string) {
  return prisma.mediaEmbed.findMany({ where: { presskitId }, orderBy: { order: "asc" } });
}

export async function createMediaEmbed(presskitId: string, input: Omit<MediaEmbedInput, "id" | "order">) {
  const last = await prisma.mediaEmbed.findFirst({ where: { presskitId }, orderBy: { order: "desc" } });
  return prisma.mediaEmbed.create({
    data: { presskitId, ...input, order: (last?.order ?? -1) + 1 },
  });
}

export class MediaEmbedNotFoundError extends Error {
  constructor() {
    super("Mídia não encontrada");
    this.name = "MediaEmbedNotFoundError";
  }
}

export async function updateMediaEmbed(presskitId: string, id: string, input: Partial<Omit<MediaEmbedInput, "id">>) {
  const existing = await prisma.mediaEmbed.findFirst({ where: { id, presskitId } });
  if (!existing) throw new MediaEmbedNotFoundError();
  return prisma.mediaEmbed.update({ where: { id }, data: input });
}

export async function deleteMediaEmbed(presskitId: string, id: string) {
  await prisma.mediaEmbed.deleteMany({ where: { id, presskitId } });
}
