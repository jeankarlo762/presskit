import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env, corsOrigins } from "./config/env";
import { prisma } from "./config/prisma";
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
import { adminRoutes } from "./modules/admin/admin.routes";
import { billingRoutes } from "./modules/billing/billing.routes";
import { webhookRoutes } from "./modules/billing/webhook.routes";
import { feedbackRoutes } from "./modules/feedback/feedback.routes";
import { runBillingHousekeeping } from "./modules/billing/billing.service";

const HOUSEKEEPING_INTERVAL_MS = 60 * 60 * 1000;
const HOUSEKEEPING_INITIAL_DELAY_MS = 30 * 1000;

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      // Bearer tokens must never end up in the log stream.
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
    // Railway terminates TLS and forwards through its edge proxy — without
    // this, request.ip is the proxy's address, which makes per-IP rate
    // limiting a single shared bucket and stores the wrong IP on refresh
    // tokens.
    trustProxy: true,
    // No file bytes ever travel through this API (uploads go straight to R2
    // via presigned URLs), so the only legitimate bodies are small JSON.
    bodyLimit: 512 * 1024,
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
    maxAge: 600,
  });
  // The global bucket is deliberately generous: the public presskit page is
  // server-rendered by the landing service, so ALL visitor traffic to
  // /public/* arrives from that one IP. Sensitive routes (login, signup,
  // refresh, checkout) tighten this per-route via `config.rateLimit`.
  await fastify.register(rateLimit, {
    global: true,
    max: 600,
    timeWindow: "1 minute",
    allowList: (request) => request.url === "/health" || request.url.startsWith("/webhooks/"),
  });
  await fastify.register(authenticatePlugin);

  // Small helper so routes that mutate the user (billing sync/cancel) can
  // re-read the row instead of answering with the stale pre-handler copy.
  fastify.decorate("prismaUser", (id: string) => prisma.user.findUnique({ where: { id } }));

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
  await fastify.register(adminRoutes);
  await fastify.register(billingRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(feedbackRoutes);

  return fastify;
}

async function main() {
  const fastify = await buildServer();

  // Billing reconciliation: hourly pull from Mercado Pago so subscriptions
  // stay correct even if a webhook never arrives. Single-replica friendly;
  // with several replicas every one would run it — harmless (idempotent),
  // just redundant.
  let housekeepingTimer: NodeJS.Timeout | null = null;
  const housekeeping = () =>
    runBillingHousekeeping(fastify.log).catch((error) => fastify.log.error(error, "Billing housekeeping falhou"));
  const initialTimer = setTimeout(() => {
    void housekeeping();
    housekeepingTimer = setInterval(() => void housekeeping(), HOUSEKEEPING_INTERVAL_MS);
  }, HOUSEKEEPING_INITIAL_DELAY_MS);

  // Railway sends SIGTERM on every redeploy; finishing in-flight requests
  // and closing the Prisma pool cleanly avoids half-written rows and noisy
  // "connection terminated" logs on each release.
  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    fastify.log.info({ signal }, "Encerrando servidor");
    clearTimeout(initialTimer);
    if (housekeepingTimer) clearInterval(housekeepingTimer);
    try {
      await fastify.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      fastify.log.error(error, "Falha ao encerrar com graça");
      process.exit(1);
    }
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
