import { z } from "zod";
import { BILLING_CYCLES, type BillingCycle, type PaymentStatus, type SubscriptionStatus } from "../constants/billing";

export const checkoutSchema = z.object({
  cycle: z.enum(BILLING_CYCLES),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** What GET /billing/me returns — the user's own billing picture. */
export type MySubscription = {
  id: string;
  cycle: BillingCycle;
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
  subscription: MySubscription | null;
  payments: MyPayment[];
  /** False when MERCADOPAGO_ACCESS_TOKEN isn't configured — the UI shows a
   * "pagamentos em breve" notice instead of a broken checkout button. */
  checkoutAvailable: boolean;
};
