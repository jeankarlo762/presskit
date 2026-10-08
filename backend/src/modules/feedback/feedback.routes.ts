import type { FastifyInstance } from "fastify";
import { feedbackCreateSchema } from "@presskit/shared";
import { createFeedback, listMyFeedback } from "./feedback.service";

export async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post(
    "/feedback",
    // Free-text that lands in the admin inbox — keep a bot from flooding it.
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = feedbackCreateSchema.parse(request.body);
      const feedback = await createFeedback(request.currentUser.id, input);
      return reply.status(201).send({ feedback });
    },
  );

  fastify.get("/feedback/mine", async (request, reply) => {
    return reply.send({ feedback: await listMyFeedback(request.currentUser.id) });
  });
}
