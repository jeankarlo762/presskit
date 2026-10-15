import bcrypt from "bcryptjs";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { env, superadminEmails } from "../../config/env";
import { generateOpaqueToken, hashToken } from "../../shared/crypto";

const BCRYPT_ROUNDS = 12;

// Compared against when the e-mail doesn't exist, so "unknown user" and
// "wrong password" take the same ~250ms — otherwise response time alone
// tells an attacker which e-mails have accounts.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(generateOpaqueToken(), BCRYPT_ROUNDS);

// Revoked tokens are kept around for a while so a replay of one can still
// be recognised as theft (see rotateRefreshToken); after that they're junk.
const REVOKED_TOKEN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Credenciais inválidas");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Este e-mail já está em uso");
    this.name = "EmailAlreadyInUseError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Refresh token inválido ou expirado");
    this.name = "InvalidRefreshTokenError";
  }
}

// The errors below carry their own statusCode/code, which errorHandler.ts
// already honours (its fastifyError.statusCode branch) — no need to grow the
// KNOWN_ERROR_STATUS map for auth-only cases.

export class GoogleLoginNotConfiguredError extends Error {
  statusCode = 503;
  code = "GoogleLoginNotConfiguredError";
  constructor() {
    super("Login com Google não configurado");
    this.name = "GoogleLoginNotConfiguredError";
  }
}

export class InvalidGoogleCredentialError extends Error {
  statusCode = 401;
  code = "InvalidGoogleCredentialError";
  constructor() {
    super("Não foi possível confirmar sua conta Google. Tente de novo.");
    this.name = "InvalidGoogleCredentialError";
  }
}

/** 400, not 401: a wrong *current* password on the account page must not
 * look like an expired session to the dashboard's refresh interceptor. */
export class WrongCurrentPasswordError extends Error {
  statusCode = 400;
  code = "WrongCurrentPasswordError";
  constructor() {
    super("Senha atual incorreta");
    this.name = "WrongCurrentPasswordError";
  }
}

/** Runs on every successful signup/login: stamps lastLoginAt (the "active
 * users" signal in the admin overview) and applies the first-operator
 * bootstrap — an e-mail listed in SUPERADMIN_EMAILS becomes SUPERADMIN.
 * The list only ever promotes; removing an address never demotes anyone
 * (that is an explicit admin action, see modules/admin). */
async function applySuperadminBootstrap(user: User): Promise<User> {
  const promote = user.role !== "SUPERADMIN" && superadminEmails.has(user.email.toLowerCase());
  return prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), ...(promote ? { role: "SUPERADMIN" } : {}) },
  });
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailAlreadyInUseError();

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });
  return applySuperadminBootstrap(user);
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    throw new InvalidCredentialsError();
  }

  // A Google-only account has no password: compare against the dummy hash
  // so it fails in the same time as a wrong password.
  const valid = await bcrypt.compare(password, user.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!valid || !user.passwordHash) throw new InvalidCredentialsError();

  return applySuperadminBootstrap(user);
}

// Google's signing keys, fetched lazily and cached/rotated by jose.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

type GoogleIdentity = { sub: string; email: string; emailVerified: boolean; name?: string };

/** Verifies a Google Identity Services ID token: signature against Google's
 * JWKS, issuer, audience (our client ID) and expiry. Anything off is the
 * same opaque error — the client can only retry. */
async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity> {
  if (!env.GOOGLE_CLIENT_ID) throw new GoogleLoginNotConfiguredError();

  let payload;
  try {
    ({ payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    }));
  } catch {
    throw new InvalidGoogleCredentialError();
  }

  const { sub, email, email_verified: emailVerified, name } = payload as Record<string, unknown>;
  if (typeof sub !== "string" || !sub || typeof email !== "string" || !email) {
    throw new InvalidGoogleCredentialError();
  }
  return {
    sub,
    email: email.trim().toLowerCase(),
    emailVerified: emailVerified === true || emailVerified === "true",
    name: typeof name === "string" ? name : undefined,
  };
}

function nameFromGoogle(identity: GoogleIdentity) {
  const candidate = (identity.name ?? identity.email.split("@")[0] ?? "").trim().slice(0, 120);
  return candidate.length >= 2 ? candidate : "Artista";
}

/** "Continuar com Google": an account already linked to this Google user
 * wins; otherwise an existing account with the same e-mail is linked — but
 * only when Google vouches for the address (email_verified), or anyone
 * could take over an account by registering its e-mail at Google first;
 * otherwise a password-less account is created. */
export async function loginWithGoogle(credential: string): Promise<{ user: User; isNewUser: boolean }> {
  const identity = await verifyGoogleCredential(credential);

  const linked = await prisma.user.findUnique({ where: { googleId: identity.sub } });
  if (linked) return { user: await applySuperadminBootstrap(linked), isNewUser: false };

  const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });
  if (byEmail) {
    // Unverified address, or the account is already tied to a different
    // Google user: never merge.
    if (!identity.emailVerified || byEmail.googleId) throw new EmailAlreadyInUseError();
    const user = await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: identity.sub } });
    return { user: await applySuperadminBootstrap(user), isNewUser: false };
  }

  try {
    const user = await prisma.user.create({
      data: { name: nameFromGoogle(identity), email: identity.email, googleId: identity.sub, passwordHash: null },
    });
    return { user: await applySuperadminBootstrap(user), isNewUser: true };
  } catch (error) {
    // Double-submitted credential racing itself: the other request created it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailAlreadyInUseError();
    }
    throw error;
  }
}

export async function updateProfile(userId: string, input: { name: string }) {
  return prisma.user.update({ where: { id: userId }, data: { name: input.name } });
}

/** Sets the first password (Google-only account) or changes the existing
 * one — then the current password is required. Every other session is
 * signed out; the caller hands the requester a fresh pair. */
export async function changePassword(userId: string, input: { currentPassword?: string; newPassword: string }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.passwordHash) {
    const valid = await bcrypt.compare(input.currentPassword ?? "", user.passwordHash);
    if (!valid || !input.currentPassword) throw new WrongCurrentPasswordError();
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await revokeAllUserSessions(user.id);
  return updated;
}

type RefreshMeta = { userAgent?: string; ip?: string };

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Cheap, per-user housekeeping piggybacked on token issuance so the table
 * doesn't grow without bound — no cron needed at this scale. */
async function pruneStaleTokens(userId: string) {
  const now = new Date();
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: new Date(now.getTime() - REVOKED_TOKEN_RETENTION_MS) } }],
    },
  });
}

/** Raw token is returned once to the caller (goes to the client); only its
 * hash is ever persisted. */
export async function issueRefreshToken(userId: string, meta: RefreshMeta = {}) {
  const rawToken = generateOpaqueToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: refreshExpiry(),
      userAgent: meta.userAgent?.slice(0, 512),
      ip: meta.ip,
    },
  });
  await pruneStaleTokens(userId);

  return rawToken;
}

/** Every active session of the user — used on refresh-token reuse (likely
 * theft) and available for a future "sign out everywhere" button. */
export async function revokeAllUserSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Rotation: the presented token is revoked and a fresh one is issued in the
 * same call. Presenting an ALREADY-revoked token means two parties hold the
 * same chain (the legitimate client already rotated it, or a thief did) —
 * the only safe answer is to kill every session of that user, so whichever
 * side is the attacker is logged out along with the victim. */
export async function rotateRefreshToken(rawToken: string, meta: RefreshMeta = {}) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) throw new InvalidRefreshTokenError();

  if (existing.revokedAt) {
    await revokeAllUserSessions(existing.userId);
    throw new InvalidRefreshTokenError();
  }

  if (existing.expiresAt < new Date()) throw new InvalidRefreshTokenError();

  const newRawToken = await prisma.$transaction(async (tx) => {
    // updateMany + count guards the race where two concurrent refreshes
    // present the same token: only the first one gets to rotate.
    const { count } = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new InvalidRefreshTokenError();

    const rotated = generateOpaqueToken();
    await tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: hashToken(rotated),
        expiresAt: refreshExpiry(),
        userAgent: meta.userAgent?.slice(0, 512),
        ip: meta.ip,
      },
    });
    return rotated;
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: existing.userId } });
  return { user, refreshToken: newRawToken };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
