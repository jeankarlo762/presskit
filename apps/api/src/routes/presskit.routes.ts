import type { FastifyInstance } from "fastify";
import { presskitOnboardingSchema } from "@presskit/shared";
import { createPresskitForUser, findPresskitByUserId } from "../services/presskit.service";

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
}
