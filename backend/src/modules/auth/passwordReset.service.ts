import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "../../config/prisma";
import { passwordResetEmail, sendMail } from "../../shared/mailer";

export const RESET_CODE_TTL_MINUTES = 15;
const CODE_TTL_MS = RESET_CODE_TTL_MINUTES * 60 * 1000;
const MAX_ATTEMPTS = 5;
// A second request inside this window is silently ignored: the first
// e-mail is still valid, and this keeps a flood of requests from turning
// the mailer into a spam cannon aimed at the victim's inbox.
const RESEND_COOLDOWN_MS = 60 * 1000;
const BCRYPT_ROUNDS = 12;

export class InvalidResetCodeError extends Error {
  constructor() {
    super("Código inválido ou expirado — peça um novo código");
    this.name = "InvalidResetCodeError";
  }
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash is bound to the user so the same 6 digits mean nothing for anyone
 * else, and nothing in the table reveals the code itself. */
function hashCode(userId: string, code: string): string {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

/**
 * Always resolves — whether or not the e-mail belongs to an account, and
 * whether or not the e-mail could be sent. A different answer in any of
 * those cases would let anyone probe which e-mails are registered.
 */
export async function requestPasswordReset(email: string, meta: { ip?: string }, log: FastifyBaseLogger) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const recent = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, consumedAt: null, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return;

  const code = generateCode();
  await prisma.$transaction([
    prisma.passwordResetCode.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash: hashCode(user.id, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        ip: meta.ip,
      },
    }),
  ]);

  try {
    await sendMail(passwordResetEmail({ to: user.email, name: user.name, code, ttlMinutes: RESET_CODE_TTL_MINUTES }));
  } catch (error) {
    log.error({ err: error, userId: user.id }, "Não foi possível enviar o código de redefinição de senha");
  }
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new InvalidResetCodeError();

  const active = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!active) throw new InvalidResetCodeError();

  if (active.attempts >= MAX_ATTEMPTS) {
    await prisma.passwordResetCode.update({ where: { id: active.id }, data: { consumedAt: new Date() } });
    throw new InvalidResetCodeError();
  }

  const expected = Buffer.from(active.codeHash, "hex");
  const presented = Buffer.from(hashCode(user.id, code), "hex");
  const matches = expected.length === presented.length && timingSafeEqual(expected, presented);
  if (!matches) {
    await prisma.passwordResetCode.update({ where: { id: active.id }, data: { attempts: { increment: 1 } } });
    throw new InvalidResetCodeError();
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Changing the password logs every device out: a thief who had a session
  // doesn't keep it, and the legitimate owner signs back in with the new one.
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetCode.update({ where: { id: active.id }, data: { consumedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}
