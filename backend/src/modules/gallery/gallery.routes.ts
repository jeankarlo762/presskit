import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import {
  confirmGalleryPhoto,
  deleteGalleryPhoto,
  listGalleryPhotos,
  reorderGalleryPhotos,
  requestGalleryUpload,
} from "./gallery.service";

const idParamSchema = z.object({ id: z.string().min(1).max(64) });
const uploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
// No `url` here on purpose — the public URL is derived server-side from the
// storage key (see storage.service publicUrlFor).
const confirmSchema = z.object({
  storageKey: z.string().min(1).max(512),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  caption: z.string().trim().max(200).optional(),
});
const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string().min(1).max(64), order: z.number().int().min(0) })).max(100),
});

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
    const photo = await confirmGalleryPhoto(presskit.id, request.currentUser.planKey, presskit.category, input);
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
