import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env, corsOrigins } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import authenticatePlugin from "./middlewares/authenticate";
import { authRoutes } from "./routes/auth.routes";
import { presskitRoutes } from "./routes/presskit.routes";
import { sectionRoutes } from "./routes/section.routes";
import { mediaRoutes } from "./routes/media.routes";
import { galleryRoutes } from "./routes/gallery.routes";
import { tourDateRoutes } from "./routes/tourdate.routes";
import { pressRoutes } from "./routes/press.routes";
import { linkRoutes } from "./routes/link.routes";
import { publicRoutes } from "./routes/public.routes";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await fastify.register(helmet);
  await fastify.register(cors, { origin: corsOrigins, credentials: true });
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
