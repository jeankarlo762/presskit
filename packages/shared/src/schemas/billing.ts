import { z } from "zod";
import { BILLING_CYCLES, type BillingCycle, type PaymentStatus, type SubscriptionStatus } from "../constants/billing";

export const checkoutSchema = z.object({
  cycle: z.enum(BILLING_CYCLES),
  /** Agency accounts only: how many artist pages the plan includes. */
  seats: z.number().int().min(1).max(50).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** What GET /billing/me returns — the user's own billing picture. */
export type MySubscription = {
  id: string;
  cycle: BillingCycle;
  seats: number;
  status: SubscriptionStatus;
  amountCents: number;
  pastDue: boolean;
  failedCharges: number;
  nextPaymentDate: string | null;
  currentPeriodEnd: string | null;
  lastChargedAt: string | null;
  cancelledAt: string | null;
  /** Only while PENDING — lets the user resume an abandoned checkout. */
  checkoutUrl: string | null;
  createdAt: string;
};

export type MyPayment = {
  id: string;
  status: PaymentStatus;
  statusDetail: string | null;
  amountCents: number;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type MyBilling = {
  planKey: "FREE" | "PRO";
  accountType: "ARTIST" | "AGENCY";
  /** AGENCY: artist pages the account may have right now (trial included). */
  artistSeats: number;
  /** AGENCY: roster pages that already exist. */
  artistsUsed: number;
  /** ISO date while the free PRO trial runs and no subscription exists. */
  trialEndsAt: string | null;
  subscription: MySubscription | null;
  payments: MyPayment[];
  /** False when MERCADOPAGO_ACCESS_TOKEN isn't configured — the UI shows a
   * "pagamentos em breve" notice instead of a broken checkout button. */
  checkoutAvailable: boolean;
};
