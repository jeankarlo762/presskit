import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  SECTION_TYPES,
  sectionDataSchemaByType,
  sectionLayoutSchema,
  sectionStyleSchema,
  sectionTitleEnSchema,
  sectionTitleSchema,
  sectionTranslationSchemaByType,
  type SectionType,
} from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import {
  addSection,
  listSections,
  removeSection,
  renameSection,
  reorderSections,
  setSectionBackgroundImage,
  setSectionVisibility,
  updateSectionStyle,
  upsertSectionData,
  upsertSectionTranslation,
} from "./section.service";
import {
  assertImageObjectExists,
  assertOwnedStorageKey,
  createImageUploadUrl,
  deleteImageObject,
  publicUrlFor,
} from "../../shared/storage.service";

const sectionTypeParamSchema = z.object({ type: z.enum(SECTION_TYPES) });
const visibilitySchema = z.object({ visible: z.boolean() });
const titleSchema = z.object({ title: sectionTitleSchema });
const reorderSchema = z.object({ order: z.array(z.enum(SECTION_TYPES)) });
const sectionUpdateBodySchema = z.object({ data: z.unknown(), title: sectionTitleSchema.optional() });
const translationBodySchema = z.object({ dataEn: z.unknown().optional(), titleEn: sectionTitleEnSchema.optional() });
const styleBodySchema = z.object({ style: sectionStyleSchema.optional(), layout: sectionLayoutSchema.optional() });
const uploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
const confirmImageSchema = z.object({ storageKey: z.string().min(1).max(512) });

export async function sectionRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/sections", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request);
    return reply.send({ sections: await listSections(presskit.id) });
  });

  // Add a section type the page doesn't have yet / remove one.
  fastify.post("/presskit/sections/:type", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await addSection(presskit.id, type);
    return reply.status(201).send({ section });
  });

  fastify.delete("/presskit/sections/:type", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request);
    await removeSection(presskit.id, type);
    return reply.status(204).send();
  });

  fastify.patch("/presskit/sections/:type", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { data: rawData, title } = sectionUpdateBodySchema.parse(request.body);
    const dataSchema = sectionDataSchemaByType[type as SectionType];
    const data = dataSchema.parse(rawData);

    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await upsertSectionData(presskit.id, type, data, title);
    return reply.send({ section });
  });

  // English variant of a section: validated against the type's partial
  // schema, stored separately so the Portuguese content is never touched.
  fastify.patch("/presskit/sections/:type/translation", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { dataEn: rawDataEn, titleEn } = translationBodySchema.parse(request.body);
    const dataEn =
      rawDataEn === undefined ? undefined : sectionTranslationSchemaByType[type as SectionType].parse(rawDataEn);

    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await upsertSectionTranslation(presskit.id, type, { dataEn, titleEn });
    return reply.send({ section });
  });

  // Per-section look: colors/background preset/width/spacing + layout variant.
  fastify.patch("/presskit/sections/:type/style", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const input = styleBodySchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await updateSectionStyle(presskit.id, type, input);
    return reply.send({ section });
  });

  // Per-section background image: same presign → PUT → confirm dance as the
  // page-level images, under the "section-bg" prefix.
  fastify.post("/presskit/sections/:type/background/upload-url", async (request, reply) => {
    sectionTypeParamSchema.parse(request.params);
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    return reply.send(await createImageUploadUrl(presskit.id, extension, "section-bg"));
  });

  fastify.post("/presskit/sections/:type/background/confirm", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { storageKey } = confirmImageSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    assertOwnedStorageKey(presskit.id, "section-bg", storageKey);
    await assertImageObjectExists(storageKey);
    const { section, previousKey } = await setSectionBackgroundImage(presskit.id, type, {
      url: publicUrlFor(storageKey),
      key: storageKey,
    });
    if (previousKey && previousKey !== storageKey) await deleteImageObject(previousKey);
    return reply.send({ section });
  });

  fastify.delete("/presskit/sections/:type/background", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request);
    const { section, previousKey } = await setSectionBackgroundImage(presskit.id, type, null);
    if (previousKey) await deleteImageObject(previousKey);
    return reply.send({ section });
  });

  fastify.patch("/presskit/sections/:type/visibility", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { visible } = visibilitySchema.parse(request.body);

    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await setSectionVisibility(presskit.id, type, visible);
    return reply.send({ section });
  });

  fastify.patch("/presskit/sections/:type/title", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { title } = titleSchema.parse(request.body);

    const presskit = await getOwnedPresskitOrThrow(request);
    const section = await renameSection(presskit.id, type, title);
    return reply.send({ section });
  });

  fastify.post("/presskit/sections/reorder", async (request, reply) => {
    const { order } = reorderSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    await reorderSections(presskit.id, order);
    return reply.status(204).send();
  });
}
