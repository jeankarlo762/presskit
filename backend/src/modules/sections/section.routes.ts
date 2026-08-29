import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SECTION_TYPES, sectionDataSchemaByType, sectionTitleSchema, type SectionType } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import { listSections, reorderSections, setSectionVisibility, upsertSectionData } from "./section.service";

const sectionTypeParamSchema = z.object({ type: z.enum(SECTION_TYPES) });
const visibilitySchema = z.object({ visible: z.boolean() });
const reorderSchema = z.object({ order: z.array(z.enum(SECTION_TYPES)) });
const sectionUpdateBodySchema = z.object({ data: z.unknown(), title: sectionTitleSchema.optional() });

export async function sectionRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/sections", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ sections: await listSections(presskit.id) });
  });

  fastify.patch("/presskit/sections/:type", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { data: rawData, title } = sectionUpdateBodySchema.parse(request.body);
    const dataSchema = sectionDataSchemaByType[type as SectionType];
    const data = dataSchema.parse(rawData);

    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const section = await upsertSectionData(presskit.id, type, data, title);
    return reply.send({ section });
  });

  fastify.patch("/presskit/sections/:type/visibility", async (request, reply) => {
    const { type } = sectionTypeParamSchema.parse(request.params);
    const { visible } = visibilitySchema.parse(request.body);

    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const section = await setSectionVisibility(presskit.id, type, visible);
    return reply.send({ section });
  });

  fastify.post("/presskit/sections/reorder", async (request, reply) => {
    const { order } = reorderSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await reorderSections(presskit.id, order);
    return reply.status(204).send();
  });
}
