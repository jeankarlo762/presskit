import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { verifyWebhookSignature } from "./mercadopago";
import {
  applyAuthorizedPaymentNotification,
  applyPaymentNotification,
  applyPreapprovalNotification,
} from "./billing.service";

const PROVIDER = "MERCADOPAGO";

type Notification = {
  id?: number | string;
  type?: string;
  topic?: string;
  action?: string;
  live_mode?: boolean;
  data?: { id?: number | string };
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // Mercado Pago sometimes POSTs with a JSON content-type and an empty body
  // (legacy IPN style, everything in the query string). Fastify's default
  // parser rejects that as malformed, so this scope parses leniently.
  fastify.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {
    try {
      done(null, body === "" ? {} : JSON.parse(body as string));
    } catch (error) {
      done(error as Error, undefined);
    }
  });

  fastify.post("/webhooks/mercadopago", async (request, reply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const body = (request.body ?? {}) as Notification;

    const type = body.type ?? body.topic ?? firstString(query.type) ?? firstString(query.topic);
    const dataId =
      (body.data?.id !== undefined ? String(body.data.id) : undefined) ??
      firstString(query["data.id"]) ??
      firstString(query.id);
    const action = body.action;

    verifyWebhookSignature({
      xSignature: request.headers["x-signature"],
      xRequestId: request.headers["x-request-id"],
      dataId: firstString(query["data.id"]) ?? dataId,
    });

    if (!type || !dataId) {
      request.log.warn({ body, query }, "Webhook MP sem type/data.id — ignorado");
      return reply.status(200).send({ ignored: true });
    }

    // Dedup key: MP's own notification id when present, otherwise a
    // composite — retries of the same event land on the same row.
    const externalId = body.id !== undefined ? String(body.id) : `${type}:${dataId}:${action ?? ""}`;

    const event = await prisma.paymentWebhookEvent.upsert({
      where: { provider_externalId: { provider: PROVIDER, externalId } },
      create: { provider: PROVIDER, externalId, type, action, payload: { body, query } as Prisma.InputJsonValue },
      update: {},
    });
    if (event.processedAt) return reply.status(200).send({ duplicate: true });

    try {
      let result: { handled: boolean; reason?: string } = { handled: false, reason: "tópico ignorado" };
      switch (type) {
        case "payment":
          result = await applyPaymentNotification(dataId);
          break;
        case "subscription_preapproval":
          result = await applyPreapprovalNotification(dataId);
          break;
        case "subscription_authorized_payment":
          result = await applyAuthorizedPaymentNotification(dataId);
          break;
        default:
          break;
      }

      await prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), error: result.handled ? null : (result.reason ?? null) },
      });
      request.log.info({ type, action, dataId, ...result }, "Webhook MP processado");
      return reply.status(200).send({ ok: true });
    } catch (error) {
      await prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      request.log.error({ err: error, type, dataId }, "Falha ao processar webhook MP");
      // 500 makes Mercado Pago retry (every 15 min) — the event row keeps
      // the error for the admin to see meanwhile.
      return reply.status(500).send({ error: "PROCESSING_FAILED" });
    }
  });
}
