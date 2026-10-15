import type { FastifyInstance } from "fastify";
import { forgotPasswordSchema, resetPasswordSchema } from "@presskit/shared";
import { requestPasswordReset, resetPasswordWithCode } from "./passwordReset.service";

// Tighter than login: each request may send an e-mail, and each attempt
// is a guess at a 6-digit code (the per-code attempt cap is the real
// guard — this just keeps the volume down).
const FORGOT_RATE_LIMIT = { config: { rateLimit: { max: 3, timeWindow: "1 minute" } } };
const RESET_RATE_LIMIT = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

export async function passwordResetRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/forgot-password", FORGOT_RATE_LIMIT, async (request, reply) => {
    const { email } = forgotPasswordSchema.parse(request.body);
    await requestPasswordReset(email, { ip: request.ip }, request.log);
    // 202 regardless of whether the account exists — see service.
    return reply.status(202).send({ ok: true });
  });

  fastify.post("/auth/reset-password", RESET_RATE_LIMIT, async (request, reply) => {
    const { email, code, password } = resetPasswordSchema.parse(request.body);
    await resetPasswordWithCode(email, code, password);
    return reply.status(204).send();
  });
}
