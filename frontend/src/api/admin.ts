import { api } from "./axios";
import type {
  AdminFeedbackQuery,
  AdminFeedbackUpdateInput,
  AdminOverview,
  AdminPaymentRow,
  AdminPaymentsQuery,
  AdminSubscriptionRow,
  AdminSubscriptionsQuery,
  AdminUpdateUserInput,
  AdminUserDetail,
  AdminUserRow,
  AdminUsersQuery,
  FeedbackRow,
  Paginated,
} from "@presskit/shared";

type QueryInput<T> = Partial<Omit<T, "page" | "pageSize">> & { page?: number; pageSize?: number };

export async function fetchAdminOverview() {
  const { data } = await api.get<AdminOverview>("/admin/overview");
  return data;
}

export async function fetchAdminUsers(params: QueryInput<AdminUsersQuery>) {
  const { data } = await api.get<Paginated<AdminUserRow>>("/admin/users", { params });
  return data;
}

export async function fetchAdminUser(id: string) {
  const { data } = await api.get<{ user: AdminUserDetail }>(`/admin/users/${id}`);
  return data.user;
}

export async function updateAdminUser(id: string, input: AdminUpdateUserInput) {
  const { data } = await api.patch<{ user: AdminUserRow }>(`/admin/users/${id}`, input);
  return data.user;
}

export async function fetchAdminSubscriptions(params: QueryInput<AdminSubscriptionsQuery>) {
  const { data } = await api.get<Paginated<AdminSubscriptionRow>>("/admin/subscriptions", { params });
  return data;
}

export async function syncAdminSubscription(id: string) {
  await api.post(`/admin/subscriptions/${id}/sync`);
}

export async function cancelAdminSubscription(id: string) {
  await api.post(`/admin/subscriptions/${id}/cancel`);
}

export async function fetchAdminPayments(params: QueryInput<AdminPaymentsQuery>) {
  const { data } = await api.get<Paginated<AdminPaymentRow>>("/admin/payments", { params });
  return data;
}

export type WebhookEventRow = {
  id: string;
  provider: string;
  type: string;
  action: string | null;
  externalId: string;
  processedAt: string | null;
  error: string | null;
  createdAt: string;
};

export async function fetchAdminWebhookEvents() {
  const { data } = await api.get<{ events: WebhookEventRow[] }>("/admin/webhook-events");
  return data.events;
}

export async function runAdminReconcile() {
  await api.post("/admin/billing/reconcile");
}

export async function fetchAdminFeedback(params: QueryInput<AdminFeedbackQuery>) {
  const { data } = await api.get<Paginated<FeedbackRow>>("/admin/feedback", { params });
  return data;
}

export async function updateAdminFeedback(id: string, input: AdminFeedbackUpdateInput) {
  const { data } = await api.patch<{ feedback: FeedbackRow }>(`/admin/feedback/${id}`, input);
  return data.feedback;
}
