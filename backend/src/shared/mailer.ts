import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

export type Mail = { to: string; subject: string; text: string; html: string };

export class MailDeliveryError extends Error {
  constructor(message: string) {
    super(`Falha ao enviar e-mail: ${message}`);
    this.name = "MailDeliveryError";
  }
}

/** True when some real transport exists. Without one, production can't
 * deliver reset codes — the admin overview surfaces this. */
export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY || env.SMTP_HOST);
}

let smtp: Transporter | null = null;
function smtpTransport(): Transporter {
  smtp ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return smtp;
}

/**
 * Transport priority: Resend (plain HTTPS, nothing to keep alive) → SMTP →
 * console in development. Production with neither configured throws, so
 * the caller decides whether that's fatal (it isn't for "forgot password":
 * the endpoint must answer the same either way to avoid leaking accounts).
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new MailDeliveryError(`Resend respondeu ${response.status}`);
    return;
  }

  if (env.SMTP_HOST) {
    try {
      await smtpTransport().sendMail({
        from: env.EMAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    } catch (error) {
      throw new MailDeliveryError(error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.log(`\n[mail:dev] para: ${mail.to}\n[mail:dev] assunto: ${mail.subject}\n${mail.text}\n`);
    return;
  }

  throw new MailDeliveryError("nenhum transporte configurado (RESEND_API_KEY ou SMTP_HOST)");
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function passwordResetEmail(input: { to: string; name: string; code: string; ttlMinutes: number }): Mail {
  const firstName = input.name.trim().split(/\s+/)[0] || "artista";
  const text = [
    `Olá, ${firstName}!`,
    "",
    `Seu código para redefinir a senha do PressKit.AI é: ${input.code}`,
    "",
    `Ele vale por ${input.ttlMinutes} minutos e só pode ser usado uma vez.`,
    "Se você não pediu a redefinição, ignore este e-mail — sua senha continua a mesma.",
    "",
    "PressKit.AI",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#08070a;font-family:Inter,Arial,sans-serif;color:#f5f5f5">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    <p style="font-size:20px;font-weight:700;letter-spacing:-0.5px;margin:0 0 24px">presskit<span style="color:#e11d9c">.ai</span></p>
    <p style="margin:0 0 16px;font-size:15px">Olá, ${escapeHtml(firstName)}!</p>
    <p style="margin:0 0 16px;font-size:15px;color:#a8a3ad">Use o código abaixo para redefinir sua senha:</p>
    <p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;background:#121016;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px 0">${escapeHtml(input.code)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#a8a3ad">Ele vale por ${input.ttlMinutes} minutos e só pode ser usado uma vez.</p>
    <p style="margin:0;font-size:13px;color:#a8a3ad">Se você não pediu a redefinição, ignore este e-mail — sua senha continua a mesma.</p>
  </div>
</body></html>`;

  return {
    to: input.to,
    subject: `${input.code} é o seu código para redefinir a senha — PressKit.AI`,
    text,
    html,
  };
}
