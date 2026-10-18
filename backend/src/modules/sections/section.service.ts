import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { SECTION_TYPES, type SectionStyle, type SectionStyleInput, type SectionType } from "@presskit/shared";
import { deleteImageObject } from "../../shared/storage.service";

export class SectionNotFoundError extends Error {
  constructor() {
    super("Seção não encontrada");
    this.name = "SectionNotFoundError";
  }
}

export async function listSections(presskitId: string) {
  const sections = await prisma.section.findMany({ where: { presskitId }, orderBy: { order: "asc" } });
  return sections;
}

async function nextOrder(presskitId: string) {
  const last = await prisma.section.findFirst({ where: { presskitId }, orderBy: { order: "desc" } });
  return (last?.order ?? -1) + 1;
}

/** Adds a section type the presskit doesn't have yet (no-op if present).
 * Starts empty and visible, at the bottom — the editor then fills it in. */
export async function addSection(presskitId: string, type: SectionType) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (existing) return existing;
  return prisma.section.create({
    data: { presskitId, type, order: await nextOrder(presskitId), visible: true, data: {} },
  });
}

/** Removes the section and its background image. Collection content (media
 * embeds, photos, dates…) lives in its own tables and is NOT deleted — the
 * section can be added back later with everything still there. */
export async function removeSection(presskitId: string, type: SectionType) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) return;
  const style = (existing.style ?? {}) as SectionStyle;
  await prisma.section.delete({ where: { id: existing.id } });
  if (style.backgroundImageKey) await deleteImageObject(style.backgroundImageKey);
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

  return prisma.section.create({
    data: { presskitId, type, title, order: await nextOrder(presskitId), data: data as object },
  });
}

/** English title/data. A section that doesn't exist yet is created empty so
 * the translation has somewhere to live (same as upsertSectionData). */
export async function upsertSectionTranslation(
  presskitId: string,
  type: SectionType,
  input: { dataEn?: unknown; titleEn?: string | null },
) {
  const patch = {
    ...(input.dataEn !== undefined ? { dataEn: input.dataEn as object } : {}),
    ...(input.titleEn !== undefined ? { titleEn: input.titleEn || null } : {}),
  };
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (existing) return prisma.section.update({ where: { id: existing.id }, data: patch });

  return prisma.section.create({
    data: { presskitId, type, order: await nextOrder(presskitId), data: {}, ...patch },
  });
}

/** Merges editable style fields over what's stored; the background image
 * fields are kept as they are (only the upload routes touch them). */
export async function updateSectionStyle(
  presskitId: string,
  type: SectionType,
  input: { style?: SectionStyleInput; layout?: string | null },
) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) throw new SectionNotFoundError();
  const current = (existing.style ?? {}) as SectionStyle;
  const merged: SectionStyle = { ...current, ...(input.style ?? {}) };
  // null means "back to the page theme" — drop the key instead of storing null.
  for (const key of Object.keys(merged) as (keyof SectionStyle)[]) {
    if (merged[key] === null || merged[key] === undefined) delete merged[key];
  }
  return prisma.section.update({
    where: { id: existing.id },
    data: {
      style: merged as Prisma.InputJsonObject,
      ...(input.layout !== undefined ? { layout: input.layout } : {}),
    },
  });
}

export async function setSectionBackgroundImage(
  presskitId: string,
  type: SectionType,
  image: { url: string; key: string } | null,
) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) throw new SectionNotFoundError();
  const current = (existing.style ?? {}) as SectionStyle;
  const previousKey = current.backgroundImageKey ?? null;
  const style: SectionStyle = { ...current };
  if (image) {
    style.backgroundImageUrl = image.url;
    style.backgroundImageKey = image.key;
  } else {
    delete style.backgroundImageUrl;
    delete style.backgroundImageKey;
  }
  const updated = await prisma.section.update({ where: { id: existing.id }, data: { style: style as Prisma.InputJsonObject } });
  return { section: updated, previousKey };
}

export async function setSectionVisibility(presskitId: string, type: SectionType, visible: boolean) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) return null;
  return prisma.section.update({ where: { id: existing.id }, data: { visible } });
}

/** Title-only rename, so an empty section (no bio yet, no contact yet) can
 * be renamed without first sending content that passes its data schema. */
export async function renameSection(presskitId: string, type: SectionType, title: string) {
  const existing = await prisma.section.findUnique({ where: { presskitId_type: { presskitId, type } } });
  if (!existing) return null;
  return prisma.section.update({ where: { id: existing.id }, data: { title } });
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
