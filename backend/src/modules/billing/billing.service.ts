import type { Prisma, PaymentStatus, Subscription, SubscriptionStatus, User } from "@prisma/client";
import {
  BILLING_GRACE_DAYS,
  BILLING_PLANS,
  cycleTotalCents,
  type BillingCycle,
  type MyBilling,
  type MyPayment,
  type MySubscription,
} from "@presskit/shared";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import {
  BillingProviderError,
  getAuthorizedPayment,
  isBillingConfigured,
  paymentClient,
  preapprovalClient,
  type MpPayment,
} from "./mercadopago";

export class AlreadySubscribedError extends Error {
  constructor() {
    super("Você já tem uma assinatura ativa");
    this.name = "AlreadySubscribedError";
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor() {
    super("Assinatura não encontrada");
    this.name = "SubscriptionNotFoundError";
  }
}

const GRACE_MS = BILLING_GRACE_DAYS * 24 * 60 * 60 * 1000;
const PENDING_CHECKOUT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_STATUSES: SubscriptionStatus[] = ["PENDING", "AUTHORIZED", "PAUSED"];

// ---------------------------------------------------------------------------
// Mapping Mercado Pago → our enums. Unknown strings never throw: the raw
// value is kept in mpRawStatus and the local status is left untouched.
// ---------------------------------------------------------------------------

function mapPreapprovalStatus(raw: string | undefined): SubscriptionStatus | null {
  switch (raw?.toLowerCase()) {
    case "pending":
      return "PENDING";
    case "authorized":
      return "AUTHORIZED";
    case "paused":
      return "PAUSED";
    case "cancelled":
      return "CANCELLED";
    default:
      return null;
  }
}

function mapPaymentStatus(raw: string | undefined): PaymentStatus {
  switch (raw?.toLowerCase()) {
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "refunded":
      return "REFUNDED";
    case "charged_back":
      return "CHARGED_BACK";
    case "cancelled":
      return "CANCELLED";
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "IN_PROCESS";
    default:
      return "PENDING";
  }
}

function toCents(amount: number | string | undefined): number {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return Number.isFinite(value) ? Math.round((value as number) * 100) : 0;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

// ---------------------------------------------------------------------------
// Entitlement + delinquency
// ---------------------------------------------------------------------------

/** PRO while a subscription is AUTHORIZED and not past due, or CANCELLED but
 * still inside the period that was already paid for. A user with no
 * subscription rows at all is left alone — that's how a superadmin's manual
 * plan override survives. */
export async function syncEntitlement(userId: string) {
  const subscriptions = await prisma.subscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const now = Date.now();
  const entitled = subscriptions.some((subscription) => {
    const periodEnd = subscription.currentPeriodEnd?.getTime();
    if (subscription.status === "AUTHORIZED") {
      if (subscription.pastDue) return false;
      return periodEnd === undefined || periodEnd + GRACE_MS > now;
    }
    if (subscription.status === "CANCELLED" || subscription.status === "PAUSED") {
      return periodEnd !== undefined && periodEnd > now;
    }
    return false;
  });

  const planKey = entitled ? "PRO" : "FREE";
  await prisma.user.updateMany({ where: { id: userId, NOT: { planKey } }, data: { planKey } });
}

/** A subscription is past due when the paid period (or, lacking one, MP's
 * next_payment_date) is more than BILLING_GRACE_DAYS behind without a newer
 * approved charge. Only AUTHORIZED subscriptions can be delinquent. */
function computePastDue(subscription: Pick<Subscription, "status" | "currentPeriodEnd" | "nextPaymentDate" | "lastChargedAt" | "failedCharges">): boolean {
  if (subscription.status !== "AUTHORIZED") return false;
  if (subscription.failedCharges > 0) return true;
  const now = Date.now();
  const anchor = subscription.currentPeriodEnd ?? subscription.nextPaymentDate;
  if (!anchor) return false;
  return anchor.getTime() + GRACE_MS < now;
}

// ---------------------------------------------------------------------------
// Checkout (user side)
// ---------------------------------------------------------------------------

export async function startCheckout(user: Pick<User, "id" | "email">, cycle: BillingCycle) {
  const open = await prisma.subscription.findMany({
    where: { userId: user.id, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "desc" },
  });
  if (open.some((subscription) => subscription.status === "AUTHORIZED" || subscription.status === "PAUSED")) {
    throw new AlreadySubscribedError();
  }

  // Resume an abandoned checkout for the same cycle instead of piling up
  // preapprovals on the MP side.
  const resumable = open.find((s) => s.status === "PENDING" && s.cycle === cycle && s.mpInitPoint);
  if (resumable) return { subscription: resumable, checkoutUrl: resumable.mpInitPoint! };

  // Any other stale pending checkout is superseded by this one.
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  const plan = BILLING_PLANS[cycle];
  const amountCents = cycleTotalCents(cycle);

  // Local row first so its id can travel to MP as external_reference —
  // that's what lets a webhook (or the return redirect) find its way back.
  const subscription = await prisma.subscription.create({
    data: { userId: user.id, cycle, amountCents, status: "PENDING" },
  });

  try {
    const response = await preapprovalClient().create({
      body: {
        reason: `PressKit.AI — plano ${plan.label}`,
        external_reference: subscription.id,
        payer_email: user.email,
        back_url: `${env.PUBLIC_DASHBOARD_URL.replace(/\/+$/, "")}/assinatura?retorno=mp`,
        auto_recurring: {
          frequency: plan.months,
          frequency_type: "months",
          transaction_amount: amountCents / 100,
          currency_id: "BRL",
        },
        status: "pending",
      },
    });

    if (!response.id || !response.init_point) throw new BillingProviderError("resposta sem id/init_point");

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpPreapprovalId: response.id,
        mpInitPoint: response.init_point,
        mpRawStatus: response.status ?? null,
        mpPayerId: response.payer_id ? String(response.payer_id) : null,
        nextPaymentDate: parseDate(response.next_payment_date),
      },
    });
    return { subscription: updated, checkoutUrl: response.init_point };
  } catch (error) {
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
    if (error instanceof BillingProviderError) throw error;
    throw new BillingProviderError();
  }
}

export async function cancelSubscription(subscriptionId: string, actor: { userId?: string }) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, ...(actor.userId ? { userId: actor.userId } : {}) },
  });
  if (!subscription) throw new SubscriptionNotFoundError();
  if (subscription.status === "CANCELLED") return subscription;

  if (subscription.mpPreapprovalId && subscription.status !== "PENDING") {
    try {
      await preapprovalClient().update({ id: subscription.mpPreapprovalId, body: { status: "cancelled" } });
    } catch {
      throw new BillingProviderError("não foi possível cancelar no Mercado Pago — tente novamente");
    }
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), mpRawStatus: "cancelled", pastDue: false },
  });
  await syncEntitlement(subscription.userId);
  return updated;
}

export async function cancelMySubscription(userId: string) {
  const active = await prisma.subscription.findFirst({
    where: { userId, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "desc" },
  });
  if (!active) throw new SubscriptionNotFoundError();
  return cancelSubscription(active.id, { userId });
}

// ---------------------------------------------------------------------------
// Sync from Mercado Pago (webhooks, return redirect, housekeeping)
// ---------------------------------------------------------------------------

/** Pulls the preapproval and reconciles the local row. Idempotent. */
export async function syncSubscriptionFromMp(subscription: Subscription) {
  if (!subscription.mpPreapprovalId) return subscription;

  let remote;
  try {
    remote = await preapprovalClient().get({ id: subscription.mpPreapprovalId });
  } catch {
    throw new BillingProviderError(`não foi possível consultar a assinatura ${subscription.mpPreapprovalId}`);
  }

  const mapped = mapPreapprovalStatus(remote.status);
  const lastCharged = parseDate(remote.summarized?.last_charged_date);
  const data: Prisma.SubscriptionUpdateInput = {
    mpRawStatus: remote.status ?? subscription.mpRawStatus,
    mpPayerId: remote.payer_id ? String(remote.payer_id) : subscription.mpPayerId,
    nextPaymentDate: parseDate(remote.next_payment_date) ?? subscription.nextPaymentDate,
    ...(mapped ? { status: mapped } : {}),
    ...(mapped === "CANCELLED" && !subscription.cancelledAt ? { cancelledAt: new Date() } : {}),
    ...(lastCharged && (!subscription.lastChargedAt || lastCharged > subscription.lastChargedAt)
      ? {
          lastChargedAt: lastCharged,
          currentPeriodEnd: addMonths(lastCharged, BILLING_PLANS[subscription.cycle].months),
          failedCharges: 0,
        }
      : {}),
  };

  let updated = await prisma.subscription.update({ where: { id: subscription.id }, data });
  const pastDue = computePastDue(updated);
  if (pastDue !== updated.pastDue) {
    updated = await prisma.subscription.update({ where: { id: updated.id }, data: { pastDue } });
  }
  await syncEntitlement(updated.userId);
  return updated;
}

export async function syncUserSubscriptions(userId: string) {
  const open = await prisma.subscription.findMany({
    where: { userId, mpPreapprovalId: { not: null }, status: { in: OPEN_STATUSES } },
  });
  for (const subscription of open) await syncSubscriptionFromMp(subscription);
  await syncEntitlement(userId);
}

async function findSubscriptionForPreapproval(preapprovalId: string) {
  const local = await prisma.subscription.findUnique({ where: { mpPreapprovalId: preapprovalId } });
  if (local) return local;

  // Not linked yet (e.g. the create response was lost): fetch and match
  // through external_reference, which we set to our subscription id.
  const remote = await preapprovalClient().get({ id: preapprovalId }).catch(() => null);
  const reference = remote?.external_reference ? String(remote.external_reference) : null;
  if (!reference) return null;
  const byReference = await prisma.subscription.findFirst({ where: { id: reference, mpPreapprovalId: null } });
  if (!byReference) return null;
  return prisma.subscription.update({
    where: { id: byReference.id },
    data: { mpPreapprovalId: preapprovalId, mpInitPoint: remote?.init_point ?? null },
  });
}

export async function applyPreapprovalNotification(preapprovalId: string) {
  const subscription = await findSubscriptionForPreapproval(preapprovalId);
  if (!subscription) return { handled: false as const, reason: "assinatura desconhecida" };
  await syncSubscriptionFromMp(subscription);
  return { handled: true as const };
}

async function resolveSubscriptionForPayment(payment: MpPayment): Promise<Subscription | null> {
  const reference = payment.external_reference ? String(payment.external_reference) : null;
  if (reference) {
    const byReference = await prisma.subscription.findUnique({ where: { id: reference } });
    if (byReference) return byReference;
  }

  const preapprovalId = payment.metadata?.preapproval_id;
  if (typeof preapprovalId === "string") {
    const byPreapproval = await findSubscriptionForPreapproval(preapprovalId);
    if (byPreapproval) return byPreapproval;
  }

  const email = payment.payer?.email?.toLowerCase();
  if (email) {
    return prisma.subscription.findFirst({
      where: { user: { email }, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: "desc" },
    });
  }
  return null;
}

/** Records (or updates) a payment and moves the subscription accordingly:
 * approved → new paid period, delinquency cleared; rejected → one more
 * failed charge, past due once the paid period lapsed. */
export async function applyPaymentNotification(mpPaymentId: string, authorizedPaymentId?: string) {
  let remote: MpPayment;
  try {
    remote = (await paymentClient().get({ id: mpPaymentId })) as unknown as MpPayment;
  } catch {
    throw new BillingProviderError(`não foi possível consultar o pagamento ${mpPaymentId}`);
  }

  const subscription = await resolveSubscriptionForPayment(remote);
  if (!subscription) return { handled: false as const, reason: "pagamento sem assinatura correspondente" };

  const status = mapPaymentStatus(remote.status);
  const paidAt = status === "APPROVED" ? (parseDate(remote.date_approved) ?? new Date()) : null;
  const amountCents = toCents(remote.transaction_amount);

  await prisma.payment.upsert({
    where: { mpPaymentId },
    create: {
      mpPaymentId,
      mpAuthorizedPaymentId: authorizedPaymentId,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      status,
      statusDetail: remote.status_detail ?? null,
      amountCents,
      currency: remote.currency_id ?? "BRL",
      paymentMethod: remote.payment_method_id ?? remote.payment_type_id ?? null,
      paidAt,
      payload: remote as unknown as Prisma.InputJsonValue,
    },
    update: {
      status,
      statusDetail: remote.status_detail ?? null,
      amountCents,
      paymentMethod: remote.payment_method_id ?? remote.payment_type_id ?? null,
      paidAt,
      ...(authorizedPaymentId ? { mpAuthorizedPaymentId: authorizedPaymentId } : {}),
      payload: remote as unknown as Prisma.InputJsonValue,
    },
  });

  if (status === "APPROVED" && paidAt) {
    const alreadyCounted = subscription.lastChargedAt && subscription.lastChargedAt >= paidAt;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        ...(subscription.status === "PENDING" ? { status: "AUTHORIZED", mpRawStatus: "authorized" } : {}),
        failedCharges: 0,
        pastDue: false,
        ...(alreadyCounted
          ? {}
          : {
              lastChargedAt: paidAt,
              currentPeriodEnd: addMonths(paidAt, BILLING_PLANS[subscription.cycle].months),
            }),
      },
    });
  } else if (status === "REJECTED" || status === "CHARGED_BACK" || status === "REFUNDED") {
    const fresh = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    const failedCharges = status === "REJECTED" ? fresh.failedCharges + 1 : fresh.failedCharges;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        failedCharges,
        pastDue: computePastDue({ ...fresh, failedCharges }),
        ...(status !== "REJECTED" && fresh.currentPeriodEnd && paidAtWithin(fresh, remote)
          ? { currentPeriodEnd: new Date() }
          : {}),
      },
    });
  }

  await syncEntitlement(subscription.userId);
  return { handled: true as const };
}

/** A refund/chargeback of the charge that opened the current period ends
 * that period now; older refunds leave the current period alone. */
function paidAtWithin(subscription: Subscription, payment: MpPayment): boolean {
  const approved = parseDate(payment.date_approved);
  if (!approved || !subscription.lastChargedAt) return false;
  return Math.abs(approved.getTime() - subscription.lastChargedAt.getTime()) < 60_000;
}

export async function applyAuthorizedPaymentNotification(authorizedPaymentId: string) {
  const remote = await getAuthorizedPayment(authorizedPaymentId);

  if (remote.payment?.id) {
    return applyPaymentNotification(String(remote.payment.id), authorizedPaymentId);
  }

  // No payment yet: MP is retrying ("recycling") or has the charge scheduled.
  if (remote.preapproval_id) {
    const subscription = await findSubscriptionForPreapproval(remote.preapproval_id);
    if (!subscription) return { handled: false as const, reason: "assinatura desconhecida" };
    if (remote.status?.toLowerCase() === "recycling") {
      const failedCharges = Math.max(subscription.failedCharges, remote.retry_attempt ?? 1);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { failedCharges, pastDue: computePastDue({ ...subscription, failedCharges }) },
      });
      await syncEntitlement(subscription.userId);
    }
    return { handled: true as const };
  }
  return { handled: false as const, reason: "cobrança sem preapproval_id" };
}

// ---------------------------------------------------------------------------
// Housekeeping — the safety net when webhooks are late or misconfigured.
// ---------------------------------------------------------------------------

export async function runBillingHousekeeping(log: { info: (o: object, m: string) => void; warn: (o: object, m: string) => void }) {
  const now = new Date();

  // Abandoned checkouts don't deserve a row forever.
  const expired = await prisma.subscription.updateMany({
    where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - PENDING_CHECKOUT_TTL_MS) } },
    data: { status: "CANCELLED", cancelledAt: now, mpRawStatus: "expired_locally" },
  });

  let synced = 0;
  let failed = 0;
  if (isBillingConfigured()) {
    const open = await prisma.subscription.findMany({
      where: { mpPreapprovalId: { not: null }, status: { in: ["PENDING", "AUTHORIZED", "PAUSED"] } },
      orderBy: { updatedAt: "asc" },
      take: 200,
    });
    for (const subscription of open) {
      try {
        await syncSubscriptionFromMp(subscription);
        synced++;
      } catch (error) {
        failed++;
        log.warn({ subscriptionId: subscription.id, error: String(error) }, "Falha ao sincronizar assinatura");
      }
    }
  }

  // Cancelled-but-still-paid users whose period has now lapsed.
  const lapsed = await prisma.subscription.findMany({
    where: { status: { in: ["CANCELLED", "PAUSED"] }, currentPeriodEnd: { lt: now }, user: { planKey: "PRO" } },
    select: { userId: true },
    distinct: ["userId"],
  });
  for (const { userId } of lapsed) await syncEntitlement(userId);

  log.info({ expiredCheckouts: expired.count, synced, failed, lapsed: lapsed.length }, "Billing housekeeping concluído");
}

// ---------------------------------------------------------------------------
// Read model for the user's own billing page
// ---------------------------------------------------------------------------

function toMySubscription(subscription: Subscription): MySubscription {
  return {
    id: subscription.id,
    cycle: subscription.cycle,
    status: subscription.status,
    amountCents: subscription.amountCents,
    pastDue: subscription.pastDue,
    failedCharges: subscription.failedCharges,
    nextPaymentDate: subscription.nextPaymentDate?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    lastChargedAt: subscription.lastChargedAt?.toISOString() ?? null,
    cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
    checkoutUrl: subscription.status === "PENDING" ? subscription.mpInitPoint : null,
    createdAt: subscription.createdAt.toISOString(),
  };
}

export async function getMyBilling(user: Pick<User, "id" | "planKey">): Promise<MyBilling> {
  const [subscription, payments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id },
      // Open subscriptions first, then the most recent cancelled one.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 24 }),
  ]);

  const current = await pickCurrentSubscription(user.id, subscription);

  return {
    planKey: user.planKey,
    subscription: current ? toMySubscription(current) : null,
    payments: payments.map(
      (payment): MyPayment => ({
        id: payment.id,
        status: payment.status,
        statusDetail: payment.statusDetail,
        amountCents: payment.amountCents,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
      }),
    ),
    checkoutAvailable: isBillingConfigured(),
  };
}

/** Prefer an open subscription; otherwise the newest cancelled one (so the
 * page can still show "ativa até dd/mm" after a cancellation). */
async function pickCurrentSubscription(userId: string, fallback: Subscription | null) {
  const open = await prisma.subscription.findFirst({
    where: { userId, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "desc" },
  });
  if (open) return open;
  return prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }) ?? fallback;
}
