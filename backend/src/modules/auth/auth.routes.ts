import type { FastifyInstance } from "fastify";
import { loginSchema, refreshSchema, signupSchema } from "@presskit/shared";
import { createUser, issueRefreshToken, revokeRefreshToken, rotateRefreshToken, verifyCredentials } from "./auth.service";
import { signAccessToken } from "../../shared/jwt";

function toPublicUser(user: { id: string; name: string; email: string; planKey: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, planKey: user.planKey, role: user.role };
}

// Credential endpoints get their own, much smaller bucket than the global
// one in server.ts: 10 attempts/min/IP is plenty for a human mistyping a
// password and useless for a brute-force run.
const CREDENTIAL_RATE_LIMIT = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };
const REFRESH_RATE_LIMIT = { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } };

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/signup", CREDENTIAL_RATE_LIMIT, async (request, reply) => {
    const input = signupSchema.parse(request.body);
    const user = await createUser(input);

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    return reply.status(201).send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/login", CREDENTIAL_RATE_LIMIT, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await verifyCredentials(input.email, input.password);

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    return reply.send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/refresh", REFRESH_RATE_LIMIT, async (request, reply) => {
    const input = refreshSchema.parse(request.body);
    const { user, refreshToken } = await rotateRefreshToken(input.refreshToken, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    const accessToken = await signAccessToken(user.id);
    return reply.send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/logout", REFRESH_RATE_LIMIT, async (request, reply) => {
    const input = refreshSchema.parse(request.body);
    await revokeRefreshToken(input.refreshToken);
    return reply.status(204).send();
  });

  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    return reply.send({ user: toPublicUser(request.currentUser) });
  });
}
