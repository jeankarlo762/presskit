import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isBotUserAgent, slugSchema } from "@presskit/shared";
import { findPublicPresskitBySlug, isSlugAvailable } from "../presskit/presskit.service";
import { recordPageView } from "../analytics/pageView.service";

const slugParamSchema = z.object({ slug: z.string() });
const viewBodySchema = z.object({
  trackableCode: z.string().optional(),
  referrerUrl: z.string().url().optional(),
  sessionId: z.string().min(1),
  country: z.string().max(2).optional(),
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

  fastify.get("/public/slug-available", async (request, reply) => {
    const { slug } = z.object({ slug: slugSchema }).parse(request.query);
    return reply.send({ available: await isSlugAvailable(slug) });
  });
}
