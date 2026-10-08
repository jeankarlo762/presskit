import { api } from "./axios";
import type { BillingCycle, BillingPlan, MyBilling } from "@presskit/shared";

export async function fetchPlans() {
  const { data } = await api.get<{ plans: BillingPlan[]; checkoutAvailable: boolean }>("/billing/plans");
  return data;
}

export async function fetchMyBilling() {
  const { data } = await api.get<MyBilling>("/billing/me");
  return data;
}

export async function startCheckout(cycle: BillingCycle) {
  const { data } = await api.post<{ checkoutUrl: string; subscriptionId: string }>("/billing/checkout", { cycle });
  return data;
}

/** After returning from Mercado Pago — pulls the latest state so the page
 * doesn't depend on the webhook having arrived yet. */
export async function syncMyBilling() {
  const { data } = await api.post<MyBilling>("/billing/sync");
  return data;
}

export async function cancelMySubscription() {
  const { data } = await api.post<MyBilling>("/billing/cancel");
  return data;
}
