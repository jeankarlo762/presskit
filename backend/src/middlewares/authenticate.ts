import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/prisma";
import { InvalidAccessTokenError, verifyAccessToken } from "../shared/jwt";

export default fp(async function authenticatePlugin(fastify: FastifyInstance) {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) throw new InvalidAccessTokenError();

    const { userId } = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new InvalidAccessTokenError();

    request.currentUser = user;
  });
});
