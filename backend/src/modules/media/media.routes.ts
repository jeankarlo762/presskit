import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { mediaEmbedSchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import { createMediaEmbed, deleteMediaEmbed, listMediaEmbeds, updateMediaEmbed } from "./mediaEmbed.service";

const idParamSchema = z.object({ id: z.string() });

export async function mediaRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/media", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ media: await listMediaEmbeds(presskit.id) });
  });

  fastify.post("/presskit/media", async (request, reply) => {
    const input = mediaEmbedSchema.omit({ id: true, order: true }).parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const media = await createMediaEmbed(presskit.id, input);
    return reply.status(201).send({ media });
  });

  fastify.patch("/presskit/media/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = mediaEmbedSchema.omit({ id: true, order: true }).partial().parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const media = await updateMediaEmbed(presskit.id, id, input);
    return reply.send({ media });
  });

  fastify.delete("/presskit/media/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await deleteMediaEmbed(presskit.id, id);
    return reply.status(204).send();
  });
}
