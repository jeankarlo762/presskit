import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../modules/auth/auth.service";
import {
  DomainAlreadyInUseError,
  DomainNotAllowedError,
  NotAnAgencyError,
  PresskitAlreadyExistsError,
  PresskitNotFoundError,
  RosterLimitError,
  RosterPageNotFoundError,
  SlugAlreadyInUseError,
} from "../modules/presskit/presskit.service";
import { DomainRegistrationError } from "../modules/admin/domains.service";
import { MediaEmbedNotFoundError } from "../modules/media/mediaEmbed.service";
import { TourDateNotFoundError } from "../modules/tourdates/tourDate.service";
import { PressMentionNotFoundError } from "../modules/press/pressMention.service";
import { TrackableLinkCodeInUseError, TrackableLinkNotFoundError } from "../modules/links/trackableLink.service";
import {
  ForeignStorageKeyError,
  StorageNotConfiguredError,
  UnsupportedImageExtensionError,
  UnsupportedVideoExtensionError,
  UploadNotFoundError,
} from "../shared/storage.service";
import { PlanLimitError } from "@presskit/shared";
import { InvalidAccessTokenError } from "../shared/jwt";
import { ForbiddenError } from "./authenticate";
import { CannotChangeOwnRoleError, LastSuperadminError, UserNotFoundError } from "../modules/admin/admin.service";
import { BillingNotConfiguredError, BillingProviderError, WebhookSignatureError } from "../modules/billing/mercadopago";
import { AlreadySubscribedError, SubscriptionNotFoundError } from "../modules/billing/billing.service";
import { FeedbackNotFoundError } from "../modules/feedback/feedback.service";
import { SectionNotFoundError } from "../modules/sections/section.service";
import { InvalidResetCodeError } from "../modules/auth/passwordReset.service";

const KNOWN_ERROR_STATUS = new Map<Function, number>([
  [InvalidCredentialsError, 401],
  [InvalidRefreshTokenError, 401],
  [InvalidAccessTokenError, 401],
  [WebhookSignatureError, 401],
  [ForbiddenError, 403],
  [UserNotFoundError, 404],
  [SubscriptionNotFoundError, 404],
  [FeedbackNotFoundError, 404],
  [SectionNotFoundError, 404],
  [CannotChangeOwnRoleError, 400],
  [InvalidResetCodeError, 400],
  [LastSuperadminError, 409],
  [AlreadySubscribedError, 409],
  [EmailAlreadyInUseError, 409],
  [PresskitNotFoundError, 404],
  [SlugAlreadyInUseError, 409],
  [DomainAlreadyInUseError, 409],
  [DomainNotAllowedError, 400],
  [DomainRegistrationError, 502],
  [PresskitAlreadyExistsError, 409],
  [NotAnAgencyError, 403],
  [RosterLimitError, 402],
  [RosterPageNotFoundError, 404],
  [PlanLimitError, 402],
  [MediaEmbedNotFoundError, 404],
  [TourDateNotFoundError, 404],
  [PressMentionNotFoundError, 404],
  [TrackableLinkNotFoundError, 404],
  [TrackableLinkCodeInUseError, 409],
  [UploadNotFoundError, 400],
  [UnsupportedImageExtensionError, 400],
  [UnsupportedVideoExtensionError, 400],
  [ForeignStorageKeyError, 403],
  [StorageNotConfiguredError, 503],
  [BillingNotConfiguredError, 503],
  [BillingProviderError, 502],
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
      if (status >= 500) request.log.error(error);
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
