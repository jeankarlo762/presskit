import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { httpUrlSchema, isBotUserAgent, slugSchema } from "@presskit/shared";
import { findPublicPresskitBySlug, isSlugAvailable } from "../presskit/presskit.service";
import { recordPageView } from "../analytics/pageView.service";

const slugParamSchema = z.object({ slug: z.string().min(1).max(80) });
const viewBodySchema = z.object({
  trackableCode: z.string().max(40).optional(),
  referrerUrl: httpUrlSchema.optional(),
  sessionId: z.string().min(1).max(128),
  country: z.string().length(2).optional(),
});

export async function publicRoutes(fastify: FastifyInstance) {
  fastify.get("/public/presskits/:slug", async (request, reply) => {
    const { slug } = slugParamSchema.parse(request.params);
    const result = await findPublicPresskitBySlug(slug);

    if (result.status === "found") return reply.send({ presskit: result.presskit });
    if (result.status === "moved") return reply.status(200).send({ movedTo: result.slug });
    return reply.status(404).send({ error: "NOT_FOUND", message: "Presskit não encontrado" });
  });

  fastify.post("/public/presskits/:slug/view", async (request, reply) => {
    if (isBotUserAgent(request.headers["user-agent"])) {
      return reply.status(204).send();
    }

    const { slug } = slugParamSchema.parse(request.params);
    const body = viewBodySchema.parse(request.body);

    const result = await findPublicPresskitBySlug(slug);
    if (result.status !== "found") return reply.status(204).send();

    await recordPageView({
      presskitId: result.presskit.id,
      trackableCode: body.trackableCode,
      referrerUrl: body.referrerUrl,
      sessionId: body.sessionId,
      country: body.country,
      userAgent: request.headers["user-agent"],
    });

    return reply.status(204).send();
  });

  fastify.get(
    "/public/slug-available",
    // Unauthenticated and hits the DB per call — keep it from being used
    // to enumerate every slug at speed.
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { slug } = z.object({ slug: slugSchema }).parse(request.query);
      return reply.send({ available: await isSlugAvailable(slug) });
    },
  );
}
