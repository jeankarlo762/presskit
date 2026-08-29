import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { requireWithinTrackableLinkLimit, type PlanKey, type TrackableLinkInput } from "@presskit/shared";

export class TrackableLinkNotFoundError extends Error {
  constructor() {
    super("Link rastreável não encontrado");
    this.name = "TrackableLinkNotFoundError";
  }
}

export class TrackableLinkCodeInUseError extends Error {
  constructor() {
    super("Já existe um link com esse código");
    this.name = "TrackableLinkCodeInUseError";
  }
}

export async function listTrackableLinks(presskitId: string) {
  return prisma.trackableLink.findMany({ where: { presskitId }, orderBy: { createdAt: "desc" } });
}

export async function createTrackableLink(presskitId: string, plan: PlanKey, input: Omit<TrackableLinkInput, "id">) {
  const currentCount = await prisma.trackableLink.count({ where: { presskitId } });
  requireWithinTrackableLinkLimit(plan, currentCount);

  try {
    return await prisma.trackableLink.create({ data: { presskitId, ...input } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new TrackableLinkCodeInUseError();
    }
    throw error;
  }
}

export async function updateTrackableLink(
  presskitId: string,
  id: string,
  input: Partial<Pick<TrackableLinkInput, "label" | "active">>,
) {
  const existing = await prisma.trackableLink.findFirst({ where: { id, presskitId } });
  if (!existing) throw new TrackableLinkNotFoundError();
  return prisma.trackableLink.update({ where: { id }, data: input });
}

export async function deleteTrackableLink(presskitId: string, id: string) {
  await prisma.trackableLink.deleteMany({ where: { id, presskitId } });
}
