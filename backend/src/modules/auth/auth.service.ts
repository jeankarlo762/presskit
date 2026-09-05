import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { generateOpaqueToken, hashToken } from "../../shared/crypto";

const BCRYPT_ROUNDS = 12;

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

export async function createUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailAlreadyInUseError();

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  return user;
}

type RefreshMeta = { userAgent?: string; ip?: string };

/** Raw token is returned once to the caller (goes to the client); only its
 * hash is ever persisted. This is what replaces the ArenaHub in-memory Map. */
export async function issueRefreshToken(userId: string, meta: RefreshMeta = {}) {
  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });

  return rawToken;
}

/** Rotation: the presented token is revoked and a fresh one is issued in the
 * same call, so a leaked-and-reused old token is a one-shot window, not a
 * standing credential. */
export async function rotateRefreshToken(rawToken: string, meta: RefreshMeta = {}) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new InvalidRefreshTokenError();
  }

  const [, newRawToken] = await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    const rotated = generateOpaqueToken();
    await tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: hashToken(rotated),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });
    return [existing, rotated] as const;
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
