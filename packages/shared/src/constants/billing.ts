export const BILLING_CYCLES = ["TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export type BillingPlan = {
  cycle: BillingCycle;
  label: string;
  months: number;
  /** Price per month, in cents — the number shown on the pricing page. */
  monthlyPriceCents: number;
  popular: boolean;
  savingsLabel?: string;
  features: string[];
};

/**
 * Single source of truth for prices: the landing page renders from it, the
 * dashboard checkout offers it, and the backend charges exactly
 * `cycleTotalCents(cycle)` per cycle — a client can never pick its own
 * amount. Values are the owner's initial pricing; change here, redeploy.
 */
export const BILLING_PLANS: Record<BillingCycle, BillingPlan> = {
  TRIMESTRAL: {
    cycle: "TRIMESTRAL",
    label: "Trimestral",
    months: 3,
    monthlyPriceCents: 5900,
    popular: false,
    features: ["Presskit publicado com seu endereço", "Galeria, vídeos e agenda", "Links rastreáveis", "Analytics básico"],
  },
  SEMESTRAL: {
    cycle: "SEMESTRAL",
    label: "Semestral",
    months: 6,
    monthlyPriceCents: 4900,
    popular: true,
    savingsLabel: "economize 17%",
    features: [
      "Tudo do trimestral",
      "Mais fotos na galeria",
      "Mais links rastreáveis",
      "Sem marca d'água",
    ],
  },
  ANUAL: {
    cycle: "ANUAL",
    label: "Anual",
    months: 12,
    monthlyPriceCents: 3900,
    popular: false,
    savingsLabel: "economize 34%",
    features: ["Tudo do semestral", "Histórico de analytics de 1 ano", "Suporte prioritário"],
  },
};

export const BILLING_PLAN_LIST: BillingPlan[] = BILLING_CYCLES.map((cycle) => BILLING_PLANS[cycle]);

/** What Mercado Pago charges once per cycle. */
export function cycleTotalCents(cycle: BillingCycle): number {
  const plan = BILLING_PLANS[cycle];
  return plan.monthlyPriceCents * plan.months;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Normalises any cycle's revenue to a per-month figure (for MRR). */
export function monthlyEquivalentCents(cycle: BillingCycle, amountCents: number): number {
  return Math.round(amountCents / BILLING_PLANS[cycle].months);
}

export const SUBSCRIPTION_STATUSES = ["PENDING", "AUTHORIZED", "PAUSED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: "Aguardando pagamento",
  AUTHORIZED: "Ativa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

export const PAYMENT_STATUSES = [
  "PENDING",
  "IN_PROCESS",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
  "CHARGED_BACK",
  "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  IN_PROCESS: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Estornado",
  CHARGED_BACK: "Chargeback",
  CANCELLED: "Cancelado",
};

/** Days after `nextPaymentDate` before an unpaid subscription loses PRO. */
export const BILLING_GRACE_DAYS = 3;
