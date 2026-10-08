import { api } from "./axios";
import type { AdminStats, AdminUpdateUserInput, AdminUserRow } from "@presskit/shared";

export type AdminUsersPage = { total: number; page: number; pageSize: number; users: AdminUserRow[] };

export async function fetchAdminStats() {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function fetchAdminUsers(params: { q?: string; page?: number; pageSize?: number }) {
  const { data } = await api.get<AdminUsersPage>("/admin/users", { params });
  return data;
}

export async function updateAdminUser(id: string, input: AdminUpdateUserInput) {
  const { data } = await api.patch<{ user: AdminUserRow }>(`/admin/users/${id}`, input);
  return data.user;
}
