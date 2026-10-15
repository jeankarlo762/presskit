import type { FastifyInstance } from "fastify";
import { analyticsSummaryQuerySchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import { getAnalyticsSummary } from "./analytics.service";

/** The artist's own analytics ("Quem abriu"). */
export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/analytics/summary", async (request, reply) => {
    const { days } = analyticsSummaryQuerySchema.parse(request.query);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const summary = await getAnalyticsSummary(presskit, request.currentUser.planKey, days);
    return reply.send({ summary });
  });
}
