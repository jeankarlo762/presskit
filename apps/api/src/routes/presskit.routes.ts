import type { FastifyInstance } from "fastify";
import { presskitOnboardingSchema, presskitUpdateSchema } from "@presskit/shared";
import {
  createPresskitForUser,
  findPresskitByUserId,
  publishPresskit,
  unpublishPresskit,
  updatePresskit,
} from "../services/presskit.service";

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
}
