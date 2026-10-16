import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { customDomainSchema, IMAGE_SLOTS, presskitOnboardingSchema, presskitUpdateSchema } from "@presskit/shared";
import {
  createPresskitForUser,
  currentImageKey,
  findPresskitByUserId,
  getCustomDomain,
  getOwnedPresskitOrThrow,
  IMAGE_SLOT_CONFIG,
  publishPresskit,
  setCustomDomain,
  setPresskitImage,
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
const confirmImageSchema = z.object({ storageKey: z.string().min(1).max(512) });
const slotParamSchema = z.object({ slot: z.enum(IMAGE_SLOTS) });
const domainBodySchema = z.object({ domain: customDomainSchema.nullable() });

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

  // Images: one presign/confirm/remove trio for every slot (background,
  // cover, avatar, logo). The legacy /presskit/theme/background-* routes
  // below are thin aliases kept for the already-deployed dashboard.
  fastify.post("/presskit/images/:slot/upload-url", async (request, reply) => {
    const { slot } = slotParamSchema.parse(request.params);
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send(await createImageUploadUrl(presskit.id, extension, IMAGE_SLOT_CONFIG[slot].folder));
  });

  fastify.post("/presskit/images/:slot/confirm", async (request, reply) => {
    const { slot } = slotParamSchema.parse(request.params);
    const { storageKey } = confirmImageSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);

    assertOwnedStorageKey(presskit.id, IMAGE_SLOT_CONFIG[slot].folder, storageKey);
    await assertImageObjectExists(storageKey);

    const previousKey = currentImageKey(presskit, slot);
    const updated = await setPresskitImage(request.currentUser.id, slot, { url: publicUrlFor(storageKey), key: storageKey });
    if (previousKey && previousKey !== storageKey) await deleteImageObject(previousKey);

    return reply.send({ presskit: updated });
  });

  fastify.delete("/presskit/images/:slot", async (request, reply) => {
    const { slot } = slotParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const previousKey = currentImageKey(presskit, slot);
    const updated = await setPresskitImage(request.currentUser.id, slot, null);
    if (previousKey) await deleteImageObject(previousKey);
    return reply.send({ presskit: updated });
  });

  fastify.post("/presskit/theme/background-upload-url", async (request, reply) => {
    const { extension } = uploadUrlSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send(await createImageUploadUrl(presskit.id, extension, "theme-bg"));
  });

  fastify.post("/presskit/theme/background-confirm", async (request, reply) => {
    const { storageKey } = confirmImageSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    assertOwnedStorageKey(presskit.id, "theme-bg", storageKey);
    await assertImageObjectExists(storageKey);
    const previousKey = presskit.themeBackgroundImageKey;
    const updated = await setPresskitImage(request.currentUser.id, "background", {
      url: publicUrlFor(storageKey),
      key: storageKey,
    });
    if (previousKey && previousKey !== storageKey) await deleteImageObject(previousKey);
    return reply.send({ presskit: updated });
  });

  fastify.delete("/presskit/theme/background", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const updated = await setPresskitImage(request.currentUser.id, "background", null);
    if (presskit.themeBackgroundImageKey) await deleteImageObject(presskit.themeBackgroundImageKey);
    return reply.send({ presskit: updated });
  });

  // Artist custom domain --------------------------------------------------
  fastify.get("/presskit/domain", async (request, reply) => {
    return reply.send(await getCustomDomain(request.currentUser.id));
  });

  fastify.put("/presskit/domain", async (request, reply) => {
    const { domain } = domainBodySchema.parse(request.body);
    return reply.send(await setCustomDomain(request.currentUser.id, domain));
  });
}
