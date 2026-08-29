import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { trackableLinkSchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import {
  createTrackableLink,
  deleteTrackableLink,
  listTrackableLinks,
  updateTrackableLink,
} from "./trackableLink.service";

const idParamSchema = z.object({ id: z.string() });
const updateSchema = trackableLinkSchema.pick({ label: true, active: true }).partial();

export async function linkRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/links", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ links: await listTrackableLinks(presskit.id) });
  });

  fastify.post("/presskit/links", async (request, reply) => {
    const input = trackableLinkSchema.omit({ id: true }).parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const link = await createTrackableLink(presskit.id, request.currentUser.planKey, input);
    return reply.status(201).send({ link });
  });

  fastify.patch("/presskit/links/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateSchema.parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const link = await updateTrackableLink(presskit.id, id, input);
    return reply.send({ link });
  });

  fastify.delete("/presskit/links/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await deleteTrackableLink(presskit.id, id);
    return reply.status(204).send();
  });
}
