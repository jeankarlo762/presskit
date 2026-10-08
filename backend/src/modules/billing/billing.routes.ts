import type { FastifyInstance } from "fastify";
import { BILLING_PLAN_LIST, checkoutSchema } from "@presskit/shared";
import { isBillingConfigured } from "./mercadopago";
import { cancelMySubscription, getMyBilling, startCheckout, syncUserSubscriptions } from "./billing.service";

const CHECKOUT_RATE_LIMIT = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

export async function billingRoutes(fastify: FastifyInstance) {
  // Public: the landing/pricing and the dashboard both read plans from here
  // so a price change is one deploy, not three.
  fastify.get("/billing/plans", async (_request, reply) => {
    return reply.send({ plans: BILLING_PLAN_LIST, checkoutAvailable: isBillingConfigured() });
  });

  fastify.register(async (authenticated) => {
    authenticated.addHook("preHandler", authenticated.authenticate);

    authenticated.get("/billing/me", async (request, reply) => {
      return reply.send(await getMyBilling(request.currentUser));
    });

    authenticated.post("/billing/checkout", CHECKOUT_RATE_LIMIT, async (request, reply) => {
      const { cycle } = checkoutSchema.parse(request.body);
      const { checkoutUrl, subscription } = await startCheckout(request.currentUser, cycle);
      return reply.status(201).send({ checkoutUrl, subscriptionId: subscription.id });
    });

    // Called by the dashboard when the buyer lands back from Mercado Pago —
    // closes the gap between "authorised on MP" and "webhook arrived".
    authenticated.post("/billing/sync", CHECKOUT_RATE_LIMIT, async (request, reply) => {
      await syncUserSubscriptions(request.currentUser.id);
      const fresh = await getMyBilling(
        (await fastify.prismaUser(request.currentUser.id)) ?? request.currentUser,
      );
      return reply.send(fresh);
    });

    authenticated.post("/billing/cancel", CHECKOUT_RATE_LIMIT, async (request, reply) => {
      await cancelMySubscription(request.currentUser.id);
      const fresh = await getMyBilling(
        (await fastify.prismaUser(request.currentUser.id)) ?? request.currentUser,
      );
      return reply.send(fresh);
    });
  });
}
