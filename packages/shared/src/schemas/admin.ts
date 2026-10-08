import { z } from "zod";
import { PLAN_KEYS } from "../constants/category";
import { USER_ROLES } from "../constants/role";
import {
  PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  type BillingCycle,
  type PaymentStatus,
  type SubscriptionStatus,
} from "../constants/billing";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "../constants/feedback";

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  plan: z.enum(PLAN_KEYS).optional(),
  role: z.enum(USER_ROLES).optional(),
  ...pagination,
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    planKey: z.enum(PLAN_KEYS).optional(),
  })
  .refine((value) => value.role !== undefined || value.planKey !== undefined, {
    message: "informe role ou planKey",
  });
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const adminSubscriptionsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  pastDue: z.enum(["true", "false"]).optional(),
  ...pagination,
});
export type AdminSubscriptionsQuery = z.infer<typeof adminSubscriptionsQuerySchema>;

export const adminPaymentsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  ...pagination,
});
export type AdminPaymentsQuery = z.infer<typeof adminPaymentsQuerySchema>;

export const adminFeedbackQuerySchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  type: z.enum(FEEDBACK_TYPES).optional(),
  ...pagination,
});
export type AdminFeedbackQuery = z.infer<typeof adminFeedbackQuerySchema>;

export type Paginated<T> = { total: number; page: number; pageSize: number; items: T[] };

/** Row shape of GET /admin/users — what the admin table renders. */
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  planKey: (typeof PLAN_KEYS)[number];
  createdAt: string;
  lastLoginAt: string | null;
  presskit: { slug: string; published: boolean; pageViews: number } | null;
  subscription: { status: SubscriptionStatus; cycle: BillingCycle; pastDue: boolean } | null;
};

export type AdminSubscriptionRow = {
  id: string;
  user: { id: string; name: string; email: string };
  cycle: BillingCycle;
  status: SubscriptionStatus;
  amountCents: number;
  pastDue: boolean;
  failedCharges: number;
  mpPreapprovalId: string | null;
  nextPaymentDate: string | null;
  currentPeriodEnd: string | null;
  lastChargedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type AdminPaymentRow = {
  id: string;
  user: { id: string; name: string; email: string };
  subscriptionId: string | null;
  mpPaymentId: string;
  status: PaymentStatus;
  statusDetail: string | null;
  amountCents: number;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserRow & {
  subscriptions: AdminSubscriptionRow[];
  payments: AdminPaymentRow[];
  feedbackCount: number;
};

export type DailyPoint = { date: string; value: number };

export type AdminOverview = {
  users: { total: number; superadmins: number; newLast7Days: number; newLast30Days: number; activeLast7Days: number };
  presskits: { total: number; published: number };
  traffic: { pageViewsLast7Days: number; pageViewsLast30Days: number };
  billing: {
    activeSubscriptions: number;
    pendingCheckouts: number;
    pastDue: number;
    cancelledLast30Days: number;
    payingUsers: number;
    mrrCents: number;
    revenueLast30DaysCents: number;
    revenueTotalCents: number;
    byCycle: Record<BillingCycle, number>;
    checkoutConfigured: boolean;
    webhookSecretConfigured: boolean;
  };
  feedback: { open: number; last30Days: number; averageRating: number | null };
  series: {
    signupsLast30Days: DailyPoint[];
    revenueLast30Days: DailyPoint[];
    pageViewsLast30Days: DailyPoint[];
  };
};
