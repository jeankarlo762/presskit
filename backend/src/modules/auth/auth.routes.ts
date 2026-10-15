import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  changePasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  signupSchema,
  updateProfileSchema,
} from "@presskit/shared";
import {
  changePassword,
  createUser,
  issueRefreshToken,
  loginWithGoogle,
  revokeRefreshToken,
  rotateRefreshToken,
  updateProfile,
  verifyCredentials,
} from "./auth.service";
import { signAccessToken } from "../../shared/jwt";
import { prisma } from "../../config/prisma";

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  planKey: string;
  role: string;
  trialEndsAt: Date | null;
  passwordHash: string | null;
  googleId: string | null;
}) {
  // Inside the trial a FREE account is reported as PRO, matching what
  // authenticate.ts grants on every request.
  const inTrial = user.planKey === "FREE" && !!user.trialEndsAt && user.trialEndsAt > new Date();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    planKey: inTrial ? "PRO" : user.planKey,
    role: user.role,
    trialEndsAt: inTrial ? user.trialEndsAt!.toISOString() : null,
    // Which sign-in methods exist — never the secrets themselves.
    hasPassword: !!user.passwordHash,
    hasGoogle: !!user.googleId,
  };
}

async function issueSession(userId: string, request: FastifyRequest) {
  const accessToken = await signAccessToken(userId);
  const refreshToken = await issueRefreshToken(userId, {
    userAgent: request.headers["user-agent"],
    ip: request.ip,
  });
  return { accessToken, refreshToken };
}

/** request.currentUser has the trial already folded into planKey (see
 * authenticate.ts), which would hide trialEndsAt from toPublicUser — the
 * account endpoints read the stored row instead. */
function loadStoredUser(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
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

  fastify.post("/auth/google", CREDENTIAL_RATE_LIMIT, async (request, reply) => {
    const input = googleLoginSchema.parse(request.body);
    const { user, isNewUser } = await loginWithGoogle(input.credential);
    const tokens = await issueSession(user.id, request);
    return reply.status(isNewUser ? 201 : 200).send({ user: toPublicUser(user), ...tokens, isNewUser });
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
    return reply.send({ user: toPublicUser(await loadStoredUser(request.currentUser.id)) });
  });

  fastify.patch("/auth/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const input = updateProfileSchema.parse(request.body);
    const user = await updateProfile(request.currentUser.id, input);
    return reply.send({ user: toPublicUser(user) });
  });

  // Same small bucket as login: this endpoint checks a password too.
  fastify.post(
    "/auth/password",
    { ...CREDENTIAL_RATE_LIMIT, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const input = changePasswordSchema.parse(request.body);
      const user = await changePassword(request.currentUser.id, input);
      // changePassword signed out every session, this one included — hand
      // the requester a fresh pair so they stay logged in here.
      const tokens = await issueSession(user.id, request);
      return reply.send({ user: toPublicUser(user), ...tokens });
    },
  );
}
