import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { mediaEmbedCreateSchema, mediaEmbedPatchSchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import {
  confirmUploadedVideo,
  createMediaEmbed,
  deleteMediaEmbed,
  listMediaEmbeds,
  requestVideoUpload,
  updateMediaEmbed,
} from "./mediaEmbed.service";

const idParamSchema = z.object({ id: z.string().min(1).max(64) });
const videoUploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
// No `url` on purpose: it is derived from the storage key server-side.
const videoConfirmSchema = z.object({
  storageKey: z.string().min(1).max(512),
  title: z.string().trim().max(150).optional(),
});

export async function mediaRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/media", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request);
    return reply.send({ media: await listMediaEmbeds(presskit.id) });
  });

  fastify.post("/presskit/media", async (request, reply) => {
    // mediaEmbedCreateSchema also rejects links parseMediaUrl can't turn
    // into a player, so nothing unrenderable ever reaches the public page.
    const input = mediaEmbedCreateSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    const media = await createMediaEmbed(presskit.id, input);
    return reply.status(201).send({ media });
  });

  fastify.post("/presskit/media/video/upload-url", async (request, reply) => {
    const { extension } = videoUploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    return reply.send(await requestVideoUpload(presskit.id, request.currentUser.planKey, extension));
  });

  fastify.post("/presskit/media/video/confirm", async (request, reply) => {
    const input = videoConfirmSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    const media = await confirmUploadedVideo(presskit.id, request.currentUser.planKey, input);
    return reply.status(201).send({ media });
  });

  fastify.patch("/presskit/media/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = mediaEmbedPatchSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request);
    const media = await updateMediaEmbed(presskit.id, id, input);
    return reply.send({ media });
  });

  fastify.delete("/presskit/media/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request);
    await deleteMediaEmbed(presskit.id, id);
    return reply.status(204).send();
  });
}
