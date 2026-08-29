import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env, corsOrigins } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import authenticatePlugin from "./middlewares/authenticate";
import { authRoutes } from "./modules/auth/auth.routes";
import { presskitRoutes } from "./modules/presskit/presskit.routes";
import { sectionRoutes } from "./modules/sections/section.routes";
import { mediaRoutes } from "./modules/media/media.routes";
import { galleryRoutes } from "./modules/gallery/gallery.routes";
import { tourDateRoutes } from "./modules/tourdates/tourdate.routes";
import { pressRoutes } from "./modules/press/press.routes";
import { linkRoutes } from "./modules/links/link.routes";
import { publicRoutes } from "./modules/public/public.routes";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
    // @fastify/cors defaults `methods` to "GET,HEAD,POST" — without this,
    // every PATCH/PUT/DELETE call from a browser fails the CORS preflight
    // silently (the request never leaves the browser), even though curl/the
    // server itself has no problem with those verbs.
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"],
  });
  await fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await fastify.register(authenticatePlugin);

  fastify.setErrorHandler(errorHandler);

  fastify.get("/health", async () => ({ status: "ok" }));

  await fastify.register(authRoutes);
  await fastify.register(presskitRoutes);
  await fastify.register(sectionRoutes);
  await fastify.register(mediaRoutes);
  await fastify.register(galleryRoutes);
  await fastify.register(tourDateRoutes);
  await fastify.register(pressRoutes);
  await fastify.register(linkRoutes);
  await fastify.register(publicRoutes);

  return fastify;
}

buildServer()
  .then((fastify) => fastify.listen({ port: env.PORT, host: "0.0.0.0" }))
  .catch((error) => {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  });
