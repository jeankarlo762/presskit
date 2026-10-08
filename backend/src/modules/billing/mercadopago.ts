import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  PreApproval,
  WebhookSignatureValidator,
} from "mercadopago";
import { env } from "../../config/env";

export class BillingNotConfiguredError extends Error {
  constructor() {
    super("Pagamentos ainda não configurados (MERCADOPAGO_ACCESS_TOKEN ausente)");
    this.name = "BillingNotConfiguredError";
  }
}

export class BillingProviderError extends Error {
  constructor(message = "O Mercado Pago não respondeu como esperado — tente novamente em instantes") {
    super(message);
    this.name = "BillingProviderError";
  }
}

export class WebhookSignatureError extends Error {
  constructor(reason: string) {
    super(`Assinatura do webhook inválida (${reason})`);
    this.name = "WebhookSignatureError";
  }
}

export function isBillingConfigured(): boolean {
  return Boolean(env.MERCADOPAGO_ACCESS_TOKEN);
}

export function isWebhookSecretConfigured(): boolean {
  return Boolean(env.MERCADOPAGO_WEBHOOK_SECRET);
}

let config: MercadoPagoConfig | null = null;
function getConfig(): MercadoPagoConfig {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) throw new BillingNotConfiguredError();
  config ??= new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 10_000 } });
  return config;
}

export function preapprovalClient() {
  return new PreApproval(getConfig());
}

export function paymentClient() {
  return new Payment(getConfig());
}

/** The fields of GET /v1/payments/:id this app actually reads. The SDK's
 * own response type is far wider; narrowing here keeps the mapping code
 * honest about what it depends on. */
export type MpPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number | string;
  currency_id?: string;
  date_approved?: string | null;
  date_created?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  external_reference?: string | number | null;
  metadata?: Record<string, unknown> | null;
  payer?: { email?: string | null; id?: string | number | null } | null;
};

/** GET /authorized_payments/:id — the SDK has no client for it, so it's a
 * plain fetch. Represents one scheduled recurring charge of a preapproval. */
export type MpAuthorizedPayment = {
  id?: number | string;
  type?: string;
  preapproval_id?: string;
  external_reference?: string | number | null;
  currency_id?: string;
  transaction_amount?: number | string;
  debit_date?: string;
  retry_attempt?: number;
  status?: string;
  payment?: { id?: number | string; status?: string; status_detail?: string } | null;
};

export async function getAuthorizedPayment(id: string): Promise<MpAuthorizedPayment> {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) throw new BillingNotConfiguredError();
  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new BillingProviderError(`authorized_payments/${id} respondeu ${response.status}`);
  return (await response.json()) as MpAuthorizedPayment;
}

/**
 * Enforced only when the secret is configured. Without it, webhooks are
 * still accepted because the handler never trusts the notification body —
 * it only uses the id to re-fetch the real resource from Mercado Pago, so
 * a forged call can at most cost us one API round-trip.
 */
export function verifyWebhookSignature(input: {
  xSignature: string | string[] | undefined;
  xRequestId: string | string[] | undefined;
  dataId: string | string[] | undefined;
}) {
  if (!env.MERCADOPAGO_WEBHOOK_SECRET) return;
  try {
    WebhookSignatureValidator.validate({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId,
      secret: env.MERCADOPAGO_WEBHOOK_SECRET,
      toleranceSeconds: 600,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) throw new WebhookSignatureError(error.reason);
    throw error;
  }
}
