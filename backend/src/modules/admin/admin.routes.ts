import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { adminUpdateUserSchema, adminUsersQuerySchema } from "@presskit/shared";
import { getStats, listUsers, updateUser } from "./admin.service";

const idParamSchema = z.object({ id: z.string().min(1).max(64) });

export async function adminRoutes(fastify: FastifyInstance) {
  // Both hooks on every route here: authenticate loads currentUser,
  // requireSuperadmin checks the role it just loaded.
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.requireSuperadmin);

  fastify.get("/admin/stats", async (_request, reply) => {
    return reply.send(await getStats());
  });

  fastify.get("/admin/users", async (request, reply) => {
    const query = adminUsersQuerySchema.parse(request.query);
    return reply.send(await listUsers(query));
  });

  fastify.patch("/admin/users/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = adminUpdateUserSchema.parse(request.body);
    const user = await updateUser(request.currentUser.id, id, input);
    return reply.send({ user });
  });
}
