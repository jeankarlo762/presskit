import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getOwnedPresskitOrThrow } from "../services/presskit.service";
import {
  confirmGalleryPhoto,
  deleteGalleryPhoto,
  listGalleryPhotos,
  reorderGalleryPhotos,
  requestGalleryUpload,
} from "../services/gallery.service";

const idParamSchema = z.object({ id: z.string() });
const uploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
const confirmSchema = z.object({
  storageKey: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().trim().max(200).optional(),
});
const reorderSchema = z.object({ order: z.array(z.object({ id: z.string(), order: z.number().int().min(0) })) });

export async function galleryRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/gallery", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ photos: await listGalleryPhotos(presskit.id) });
  });

  fastify.post("/presskit/gallery/upload-url", async (request, reply) => {
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const result = await requestGalleryUpload(
      presskit.id,
      request.currentUser.planKey,
      presskit.category,
      extension,
    );
    return reply.send(result);
  });

  fastify.post("/presskit/gallery/confirm", async (request, reply) => {
    const input = confirmSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const photo = await confirmGalleryPhoto(presskit.id, input);
    return reply.status(201).send({ photo });
  });

  fastify.delete("/presskit/gallery/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await deleteGalleryPhoto(presskit.id, id);
    return reply.status(204).send();
  });

  fastify.patch("/presskit/gallery/reorder", async (request, reply) => {
    const { order } = reorderSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await reorderGalleryPhotos(presskit.id, order);
    return reply.status(204).send();
  });
}
