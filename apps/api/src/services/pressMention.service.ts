import { prisma } from "../config/prisma";
import type { PressMentionInput } from "@presskit/shared";

export class PressMentionNotFoundError extends Error {
  constructor() {
    super("Menção de imprensa não encontrada");
    this.name = "PressMentionNotFoundError";
  }
}

export async function listPressMentions(presskitId: string) {
  return prisma.pressMention.findMany({ where: { presskitId }, orderBy: { publishedAt: "desc" } });
}

export async function createPressMention(presskitId: string, input: Omit<PressMentionInput, "id">) {
  return prisma.pressMention.create({ data: { presskitId, ...input } });
}

export async function updatePressMention(
  presskitId: string,
  id: string,
  input: Partial<Omit<PressMentionInput, "id">>,
) {
  const existing = await prisma.pressMention.findFirst({ where: { id, presskitId } });
  if (!existing) throw new PressMentionNotFoundError();
  return prisma.pressMention.update({ where: { id }, data: input });
}

export async function deletePressMention(presskitId: string, id: string) {
  await prisma.pressMention.deleteMany({ where: { id, presskitId } });
}
