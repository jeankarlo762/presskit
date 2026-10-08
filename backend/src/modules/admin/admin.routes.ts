import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  adminFeedbackQuerySchema,
  adminFeedbackUpdateSchema,
  adminPaymentsQuerySchema,
  adminSubscriptionsQuerySchema,
  adminUpdateUserSchema,
  adminUsersQuerySchema,
} from "@presskit/shared";
import {
  getOverview,
  getUserDetail,
  listPayments,
  listRecentWebhookEvents,
  listSubscriptions,
  listUsers,
  updateUser,
} from "./admin.service";
import { listFeedback, updateFeedback } from "../feedback/feedback.service";
import { cancelSubscription, runBillingHousekeeping, syncSubscriptionFromMp, SubscriptionNotFoundError } from "../billing/billing.service";
import { prisma } from "../../config/prisma";

const idParamSchema = z.object({ id: z.string().min(1).max(64) });

export async function adminRoutes(fastify: FastifyInstance) {
  // Both hooks on every route here: authenticate loads currentUser,
  // requireSuperadmin checks the role it just loaded.
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.requireSuperadmin);

  fastify.get("/admin/overview", async (_request, reply) => reply.send(await getOverview()));

  // Users -------------------------------------------------------------------
  fastify.get("/admin/users", async (request, reply) => {
    return reply.send(await listUsers(adminUsersQuerySchema.parse(request.query)));
  });

  fastify.get("/admin/users/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    return reply.send({ user: await getUserDetail(id) });
  });

  fastify.patch("/admin/users/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = adminUpdateUserSchema.parse(request.body);
    return reply.send({ user: await updateUser(request.currentUser.id, id, input) });
  });

  // Billing -----------------------------------------------------------------
  fastify.get("/admin/subscriptions", async (request, reply) => {
    return reply.send(await listSubscriptions(adminSubscriptionsQuerySchema.parse(request.query)));
  });

  fastify.post("/admin/subscriptions/:id/sync", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new SubscriptionNotFoundError();
    await syncSubscriptionFromMp(subscription);
    const refreshed = await listSubscriptions({ q: undefined, page: 1, pageSize: 1, status: undefined, pastDue: undefined });
    return reply.send({ ok: true, sample: refreshed.items[0] ?? null });
  });

  fastify.post("/admin/subscriptions/:id/cancel", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await cancelSubscription(id, {});
    return reply.send({ ok: true });
  });

  fastify.get("/admin/payments", async (request, reply) => {
    return reply.send(await listPayments(adminPaymentsQuerySchema.parse(request.query)));
  });

  fastify.get("/admin/webhook-events", async (_request, reply) => {
    return reply.send({ events: await listRecentWebhookEvents() });
  });

  // Forces the hourly reconciliation now — handy right after configuring
  // Mercado Pago, or when a webhook was missed.
  fastify.post("/admin/billing/reconcile", async (request, reply) => {
    await runBillingHousekeeping(request.log);
    return reply.send({ ok: true });
  });

  // Feedback ----------------------------------------------------------------
  fastify.get("/admin/feedback", async (request, reply) => {
    return reply.send(await listFeedback(adminFeedbackQuerySchema.parse(request.query)));
  });

  fastify.patch("/admin/feedback/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = adminFeedbackUpdateSchema.parse(request.body);
    return reply.send({ feedback: await updateFeedback(id, input) });
  });
}
