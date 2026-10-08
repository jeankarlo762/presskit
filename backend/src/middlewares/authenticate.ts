import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/prisma";
import { InvalidAccessTokenError, verifyAccessToken } from "../shared/jwt";

export class ForbiddenError extends Error {
  constructor() {
    super("Você não tem permissão para isso");
    this.name = "ForbiddenError";
  }
}

export default fp(async function authenticatePlugin(fastify: FastifyInstance) {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) throw new InvalidAccessTokenError();

    const { userId } = await verifyAccessToken(token);
    // Fresh DB read on every request (not the JWT payload) so a role or
    // plan change takes effect immediately, not after the token expires.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new InvalidAccessTokenError();

    request.currentUser = user;
  });

  fastify.decorate("requireSuperadmin", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser) await fastify.authenticate(request, reply);
    if (request.currentUser.role !== "SUPERADMIN") throw new ForbiddenError();
  });
});
