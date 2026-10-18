import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import {
  assertOwnedStorageKey,
  createFileUploadUrl,
  deleteImageObject,
  describeStoredFile,
  publicUrlFor,
} from "../../shared/storage.service";

const uploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
const keySchema = z.object({ storageKey: z.string().min(1).max(512) });

/**
 * Downloadable press material (DOWNLOADS section, rider PDF). The file's
 * public URL ends up inside the section's data as a plain link, so the
 * section schema doesn't care whether a download is hosted here or on
 * Drive — only the confirm step proves the upload landed and sizes it.
 */
export async function filesRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post("/presskit/files/upload-url", async (request, reply) => {
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send(await createFileUploadUrl(presskit.id, extension));
  });

  fastify.post("/presskit/files/confirm", async (request, reply) => {
    const { storageKey } = keySchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    assertOwnedStorageKey(presskit.id, "files", storageKey);
    const info = await describeStoredFile(storageKey);
    return reply.send({ url: publicUrlFor(storageKey), storageKey, ...info });
  });

  // Removing a download from the section is the client's business; this
  // lets it also free the object once the link is gone from the data.
  fastify.delete("/presskit/files", async (request, reply) => {
    const { storageKey } = keySchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    assertOwnedStorageKey(presskit.id, "files", storageKey);
    await deleteImageObject(storageKey);
    return reply.status(204).send();
  });
}
