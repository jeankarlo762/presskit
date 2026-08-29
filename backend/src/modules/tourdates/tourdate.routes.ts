import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { tourDateSchema } from "@presskit/shared";
import { getOwnedPresskitOrThrow } from "../presskit/presskit.service";
import { createTourDate, deleteTourDate, listTourDates, updateTourDate } from "./tourDate.service";

const idParamSchema = z.object({ id: z.string() });

export async function tourDateRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/presskit/tour-dates", async (request, reply) => {
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    return reply.send({ tourDates: await listTourDates(presskit.id) });
  });

  fastify.post("/presskit/tour-dates", async (request, reply) => {
    const input = tourDateSchema.omit({ id: true }).parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const tourDate = await createTourDate(presskit.id, input);
    return reply.status(201).send({ tourDate });
  });

  fastify.patch("/presskit/tour-dates/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = tourDateSchema.omit({ id: true }).partial().parse(request.body);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    const tourDate = await updateTourDate(presskit.id, id, input);
    return reply.send({ tourDate });
  });

  fastify.delete("/presskit/tour-dates/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const presskit = await getOwnedPresskitOrThrow(request.currentUser.id);
    await deleteTourDate(presskit.id, id);
    return reply.status(204).send();
  });
}
