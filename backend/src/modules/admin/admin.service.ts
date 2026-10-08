import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  BILLING_CYCLES,
  monthlyEquivalentCents,
  type AdminOverview,
  type AdminPaymentRow,
  type AdminPaymentsQuery,
  type AdminSubscriptionRow,
  type AdminSubscriptionsQuery,
  type AdminUpdateUserInput,
  type AdminUserDetail,
  type AdminUserRow,
  type AdminUsersQuery,
  type BillingCycle,
  type DailyPoint,
  type Paginated,
} from "@presskit/shared";
import { isBillingConfigured, isWebhookSecretConfigured } from "../billing/mercadopago";

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado");
    this.name = "UserNotFoundError";
  }
}

export class CannotChangeOwnRoleError extends Error {
  constructor() {
    super("Você não pode alterar o seu próprio papel");
    this.name = "CannotChangeOwnRoleError";
  }
}

export class LastSuperadminError extends Error {
  constructor() {
    super("Não é possível rebaixar o último superadmin");
    this.name = "LastSuperadminError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_STATUSES = ["PENDING", "AUTHORIZED", "PAUSED"] as const;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const userRowSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  planKey: true,
  createdAt: true,
  lastLoginAt: true,
  presskit: {
    select: { slug: true, published: true, _count: { select: { pageViews: true } } },
  },
  subscriptions: {
    where: { status: { in: [...OPEN_STATUSES] } },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { status: true, cycle: true, pastDue: true },
  },
} satisfies Prisma.UserSelect;

type UserRowRecord = Prisma.UserGetPayload<{ select: typeof userRowSelect }>;

function toUserRow(user: UserRowRecord): AdminUserRow {
  const subscription = user.subscriptions[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planKey: user.planKey,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    presskit: user.presskit
      ? { slug: user.presskit.slug, published: user.presskit.published, pageViews: user.presskit._count.pageViews }
      : null,
    subscription: subscription
      ? { status: subscription.status, cycle: subscription.cycle, pastDue: subscription.pastDue }
      : null,
  };
}

function userSearch(q: string | undefined): Prisma.UserWhereInput {
  if (!q) return {};
  return {
    OR: [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { presskit: { slug: { contains: q, mode: "insensitive" } } },
    ],
  };
}

export async function listUsers(query: AdminUsersQuery): Promise<Paginated<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    ...userSearch(query.q),
    ...(query.plan ? { planKey: query.plan } : {}),
    ...(query.role ? { role: query.role } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userRowSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, page: query.page, pageSize: query.pageSize, items: users.map(toUserRow) };
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userRowSelect });
  if (!user) throw new UserNotFoundError();

  const [subscriptions, payments, feedbackCount] = await Promise.all([
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: subscriptionSelect }),
    prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50, select: paymentSelect }),
    prisma.feedback.count({ where: { userId } }),
  ]);

  return {
    ...toUserRow(user),
    subscriptions: subscriptions.map(toSubscriptionRow),
    payments: payments.map(toPaymentRow),
    feedbackCount,
  };
}

/** `actorId` is who is making the change — an admin can never change their
 * own role (so a slip can't lock them out), and the platform always keeps
 * at least one SUPERADMIN. */
export async function updateUser(actorId: string, userId: string, input: AdminUpdateUserInput) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) throw new UserNotFoundError();

  if (input.role !== undefined && input.role !== target.role) {
    if (target.id === actorId) throw new CannotChangeOwnRoleError();
    if (target.role === "SUPERADMIN" && input.role !== "SUPERADMIN") {
      const remaining = await prisma.user.count({ where: { role: "SUPERADMIN", id: { not: target.id } } });
      if (remaining === 0) throw new LastSuperadminError();
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.planKey !== undefined ? { planKey: input.planKey } : {}),
    },
    select: userRowSelect,
  });
  return toUserRow(updated);
}

// ---------------------------------------------------------------------------
// Subscriptions & payments
// ---------------------------------------------------------------------------

const subscriptionSelect = {
  id: true,
  cycle: true,
  status: true,
  amountCents: true,
  pastDue: true,
  failedCharges: true,
  mpPreapprovalId: true,
  nextPaymentDate: true,
  currentPeriodEnd: true,
  lastChargedAt: true,
  cancelledAt: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SubscriptionSelect;

type SubscriptionRecord = Prisma.SubscriptionGetPayload<{ select: typeof subscriptionSelect }>;

function toSubscriptionRow(subscription: SubscriptionRecord): AdminSubscriptionRow {
  return {
    ...subscription,
    nextPaymentDate: subscription.nextPaymentDate?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    lastChargedAt: subscription.lastChargedAt?.toISOString() ?? null,
    cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
    createdAt: subscription.createdAt.toISOString(),
  };
}

export async function listSubscriptions(query: AdminSubscriptionsQuery): Promise<Paginated<AdminSubscriptionRow>> {
  const where: Prisma.SubscriptionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.pastDue ? { pastDue: query.pastDue === "true" } : {}),
    ...(query.q ? { user: userSearch(query.q) } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      orderBy: [{ pastDue: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: subscriptionSelect,
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items: rows.map(toSubscriptionRow) };
}

const paymentSelect = {
  id: true,
  subscriptionId: true,
  mpPaymentId: true,
  status: true,
  statusDetail: true,
  amountCents: true,
  paymentMethod: true,
  paidAt: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

function toPaymentRow(payment: PaymentRecord): AdminPaymentRow {
  return {
    ...payment,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function listPayments(query: AdminPaymentsQuery): Promise<Paginated<AdminPaymentRow>> {
  const where: Prisma.PaymentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? { OR: [{ mpPaymentId: { contains: query.q } }, { user: userSearch(query.q) }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: paymentSelect,
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items: rows.map(toPaymentRow) };
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

type RawDaily = { day: Date; value: number };

/** Fills every day in the window so the chart has no gaps. */
function toSeries(rows: RawDaily[], since: Date, days: number): DailyPoint[] {
  const byDay = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.value)]));
  const series: DailyPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(since.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    series.push({ date, value: byDay.get(date) ?? 0 });
  }
  return series;
}

export async function getOverview(): Promise<AdminOverview> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY_MS);
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const since30 = new Date(Date.UTC(d30.getUTCFullYear(), d30.getUTCMonth(), d30.getUTCDate() + 1));

  const [
    users,
    superadmins,
    newLast7Days,
    newLast30Days,
    activeLast7Days,
    presskits,
    publishedPresskits,
    pageViewsLast7Days,
    pageViewsLast30Days,
    activeSubs,
    pendingCheckouts,
    pastDue,
    cancelledLast30Days,
    revenueLast30,
    revenueTotal,
    feedbackOpen,
    feedbackLast30,
    feedbackRating,
    signupRows,
    revenueRows,
    viewRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d7 } } }),
    prisma.presskit.count(),
    prisma.presskit.count({ where: { published: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: d7 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: d30 } } }),
    prisma.subscription.findMany({
      where: { status: "AUTHORIZED" },
      select: { userId: true, cycle: true, amountCents: true, pastDue: true },
    }),
    prisma.subscription.count({ where: { status: "PENDING" } }),
    prisma.subscription.count({ where: { status: "AUTHORIZED", pastDue: true } }),
    prisma.subscription.count({ where: { status: "CANCELLED", cancelledAt: { gte: d30 } } }),
    prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: "APPROVED", paidAt: { gte: d30 } } }),
    prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: "APPROVED" } }),
    prisma.feedback.count({ where: { status: { not: "RESOLVIDO" } } }),
    prisma.feedback.count({ where: { createdAt: { gte: d30 } } }),
    prisma.feedback.aggregate({ _avg: { rating: true }, where: { rating: { not: null } } }),
    prisma.$queryRaw<RawDaily[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS value
      FROM "User" WHERE "createdAt" >= ${since30} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<RawDaily[]>`
      SELECT date_trunc('day', "paidAt") AS day, COALESCE(SUM("amountCents"), 0)::int AS value
      FROM "Payment" WHERE status = 'APPROVED'::"PaymentStatus" AND "paidAt" >= ${since30} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<RawDaily[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS value
      FROM "PageView" WHERE "createdAt" >= ${since30} GROUP BY 1 ORDER BY 1`,
  ]);

  const byCycle = Object.fromEntries(BILLING_CYCLES.map((cycle) => [cycle, 0])) as Record<BillingCycle, number>;
  let mrrCents = 0;
  const payingUsers = new Set<string>();
  for (const subscription of activeSubs) {
    byCycle[subscription.cycle]++;
    if (!subscription.pastDue) {
      mrrCents += monthlyEquivalentCents(subscription.cycle, subscription.amountCents);
      payingUsers.add(subscription.userId);
    }
  }

  return {
    users: { total: users, superadmins, newLast7Days, newLast30Days, activeLast7Days },
    presskits: { total: presskits, published: publishedPresskits },
    traffic: { pageViewsLast7Days, pageViewsLast30Days },
    billing: {
      activeSubscriptions: activeSubs.length,
      pendingCheckouts,
      pastDue,
      cancelledLast30Days,
      payingUsers: payingUsers.size,
      mrrCents,
      revenueLast30DaysCents: revenueLast30._sum.amountCents ?? 0,
      revenueTotalCents: revenueTotal._sum.amountCents ?? 0,
      byCycle,
      checkoutConfigured: isBillingConfigured(),
      webhookSecretConfigured: isWebhookSecretConfigured(),
    },
    feedback: {
      open: feedbackOpen,
      last30Days: feedbackLast30,
      averageRating: feedbackRating._avg.rating ? Math.round(feedbackRating._avg.rating * 10) / 10 : null,
    },
    series: {
      signupsLast30Days: toSeries(signupRows, since30, 30),
      revenueLast30Days: toSeries(revenueRows, since30, 30),
      pageViewsLast30Days: toSeries(viewRows, since30, 30),
    },
  };
}

export async function listRecentWebhookEvents(limit = 50) {
  const events = await prisma.paymentWebhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, provider: true, type: true, action: true, externalId: true, processedAt: true, error: true, createdAt: true },
  });
  return events.map((event) => ({
    ...event,
    processedAt: event.processedAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
  }));
}
