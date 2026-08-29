import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pressMentionSchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import { createPressMention, deletePressMention, listPressMentions, updatePressMention } from "./pressMention.service";

const idParamSchema = z.object({ id: z.string() });

export async function pressRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/press", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ press: await listPressMentions(presskit.id) });
  });

  fastify.post("/presskit/press", async (request, reply) => {
    const input = pressMentionSchema.omit({ id: true }).parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const mention = await createPressMention(presskit.id, input);
    return reply.status(201).send({ mention });
  });

  fastify.patch("/presskit/press/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = pressMentionSchema.omit({ id: true }).partial().parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const mention = await updatePressMention(presskit.id, id, input);
    return reply.send({ mention });
  });

  fastify.delete("/presskit/press/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await deletePressMention(presskit.id, id);
    return reply.status(204).send();
  });
}
