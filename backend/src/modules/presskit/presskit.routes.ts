import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { presskitOnboardingSchema, presskitUpdateSchema } from "@presskit/shared";
import {
  createPresskitForUser,
  findPresskitByUserId,
  getOwnedPresskitOrThrow,
  publishPresskit,
  setThemeBackgroundImage,
  unpublishPresskit,
  updatePresskit,
} from "./presskit.service";
import {
  assertImageObjectExists,
  assertOwnedStorageKey,
  createImageUploadUrl,
  deleteImageObject,
  publicUrlFor,
} from "../../shared/storage.service";

const uploadUrlSchema = z.object({ extension: z.string().min(1).max(10) });
const confirmBackgroundSchema = z.object({ storageKey: z.string().min(1).max(512) });

export async function presskitRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit", async (request, reply) => {
    const presskit = await findPresskitByUserId(request.currentUser.id);
    return reply.send({ presskit });
  });

  fastify.post("/presskit/onboarding", async (request, reply) => {
    const input = presskitOnboardingSchema.parse(request.body);
    const presskit = await createPresskitForUser(request.currentUser.id, input.category, input.slug);
    return reply.status(201).send({ presskit });
  });

  fastify.patch("/presskit", async (request, reply) => {
    const input = presskitUpdateSchema.parse(request.body);
    const presskit = await updatePresskit(request.currentUser.id, input);
    return reply.send({ presskit });
  });

  fastify.post("/presskit/publish", async (request, reply) => {
    const presskit = await publishPresskit(request.currentUser.id);
    return reply.send({ presskit });
  });

  fastify.post("/presskit/unpublish", async (request, reply) => {
    const presskit = await unpublishPresskit(request.currentUser.id);
    return reply.send({ presskit });
  });

  fastify.post("/presskit/theme/background-upload-url", async (request, reply) => {
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const result = await createImageUploadUrl(presskit.id, extension, "theme-bg");
    return reply.send(result);
  });

  fastify.post("/presskit/theme/background-confirm", async (request, reply) => {
    const { storageKey } = confirmBackgroundSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);

    assertOwnedStorageKey(presskit.id, "theme-bg", storageKey);
    await assertImageObjectExists(storageKey);

    const previousKey = presskit.themeBackgroundImageKey;
    const updated = await setThemeBackgroundImage(request.currentUser.id, {
      url: publicUrlFor(storageKey),
      key: storageKey,
    });
    if (previousKey && previousKey !== storageKey) await deleteImageObject(previousKey);

    return reply.send({ presskit: updated });
  });

  fastify.delete("/presskit/theme/background", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const updated = await setThemeBackgroundImage(request.currentUser.id, null);
    if (presskit.themeBackgroundImageKey) await deleteImageObject(presskit.themeBackgroundImageKey);
    return reply.send({ presskit: updated });
  });
}
