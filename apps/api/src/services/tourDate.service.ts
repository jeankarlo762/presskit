import { prisma } from "../config/prisma";
import type { TourDateInput } from "@presskit/shared";

export class TourDateNotFoundError extends Error {
  constructor() {
    super("Data de show não encontrada");
    this.name = "TourDateNotFoundError";
  }
}

export async function listTourDates(presskitId: string) {
  return prisma.tourDate.findMany({ where: { presskitId }, orderBy: { date: "asc" } });
}

export async function createTourDate(presskitId: string, input: Omit<TourDateInput, "id">) {
  return prisma.tourDate.create({ data: { presskitId, ...input } });
}

export async function updateTourDate(presskitId: string, id: string, input: Partial<Omit<TourDateInput, "id">>) {
  const existing = await prisma.tourDate.findFirst({ where: { id, presskitId } });
  if (!existing) throw new TourDateNotFoundError();
  return prisma.tourDate.update({ where: { id }, data: input });
}

export async function deleteTourDate(presskitId: string, id: string) {
  await prisma.tourDate.deleteMany({ where: { id, presskitId } });
}
