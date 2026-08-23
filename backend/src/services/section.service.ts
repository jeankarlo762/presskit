import { prisma } from "../config/prisma";
import { SECTION_TYPES, type SectionType } from "@presskit/shared";

export async function listSections(presskitId: string) {
  const sections = await prisma.section.findMany({ where: { presskitId }, orderBy: { order: "asc" } });
  return sections;
}

/** Sections are seeded on onboarding (one row per type in the category's
 * default set), so editing one is always an update — a section that isn't
 * part of the artist's current set simply doesn't exist yet and is created
 * on first write, keeping the editor able to turn on any section type later.
 * `title` is optional per call — omitting it leaves whatever title (or lack
 * of one) the section already has untouched. */
export async function upsertSectionData(
  presskitId: string,
  type: SectionType,
  data: unknown,
  title?: string,
) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (existing) {
    return prisma.section.update({
      where: { id: existing.id },
      data: { data: data as object, ...(title !== undefined ? { title } : {}) },
    });
  }

  const last = await prisma.section.findFirst({ where: { presskitId }, orderBy: { order: "desc" } });
  return prisma.section.create({
    data: { presskitId, type, title, order: (last?.order ?? -1) + 1, data: data as object },
  });
}

export async function setSectionVisibility(presskitId: string, type: SectionType, visible: boolean) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) return null;
  return prisma.section.update({ where: { id: existing.id }, data: { visible } });
}

export async function reorderSections(presskitId: string, order: SectionType[]) {
  const uniqueTypes = new Set(order);
  if (uniqueTypes.size !== order.length || !order.every((type) => SECTION_TYPES.includes(type))) {
    throw new Error("Lista de ordenação de seções inválida");
  }

  await prisma.$transaction(
    order.map((type, index) =>
      prisma.section.updateMany({ where: { presskitId, type }, data: { order: index } }),
    ),
  );
}
