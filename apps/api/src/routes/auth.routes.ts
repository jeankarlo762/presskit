import type { FastifyInstance } from "fastify";
import { loginSchema, refreshSchema, signupSchema } from "@presskit/shared";
import { createUser, issueRefreshToken, revokeRefreshToken, rotateRefreshToken, verifyCredentials } from "../services/auth.service";
import { signAccessToken } from "../utils/jwt";

function toPublicUser(user: { id: string; name: string; email: string; planKey: string }) {
  return { id: user.id, name: user.name, email: user.email, planKey: user.planKey };
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/signup", async (request, reply) => {
    const input = signupSchema.parse(request.body);
    const user = await createUser(input);

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    return reply.status(201).send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await verifyCredentials(input.email, input.password);

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    return reply.send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const input = refreshSchema.parse(request.body);
    const { user, refreshToken } = await rotateRefreshToken(input.refreshToken, {
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });

    const accessToken = await signAccessToken(user.id);
    return reply.send({ user: toPublicUser(user), accessToken, refreshToken });
  });

  fastify.post("/auth/logout", async (request, reply) => {
    const input = refreshSchema.parse(request.body);
    await revokeRefreshToken(input.refreshToken);
    return reply.status(204).send();
  });

  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    return reply.send({ user: toPublicUser(request.currentUser) });
  });
}
