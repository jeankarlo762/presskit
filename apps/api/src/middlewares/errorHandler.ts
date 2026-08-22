import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../services/auth.service";
import {
  PresskitAlreadyExistsError,
  PresskitNotFoundError,
  SlugAlreadyInUseError,
} from "../services/presskit.service";
import { PlanLimitError } from "@presskit/shared";
import { InvalidAccessTokenError } from "../utils/jwt";

const KNOWN_ERROR_STATUS = new Map<Function, number>([
  [InvalidCredentialsError, 401],
  [InvalidRefreshTokenError, 401],
  [InvalidAccessTokenError, 401],
  [EmailAlreadyInUseError, 409],
  [PresskitNotFoundError, 404],
  [SlugAlreadyInUseError, 409],
  [PresskitAlreadyExistsError, 409],
  [PlanLimitError, 402],
]);

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      issues: error.flatten(),
    });
  }

  for (const [ErrorClass, status] of KNOWN_ERROR_STATUS) {
    if (error instanceof ErrorClass) {
      return reply.status(status).send({ error: error.name, message: error.message });
    }
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    return reply.status(fastifyError.statusCode).send({
      error: fastifyError.code ?? "REQUEST_ERROR",
      message: fastifyError.message,
    });
  }

  request.log.error(error);
  return reply.status(500).send({ error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
}
