import axios from "axios";
import { api } from "./axios";
import { API_URL } from "../config";
import type { AuthUser } from "../store/auth.store";

/** /auth/me and the account endpoints also say which sign-in methods the
 * account has. */
export type AccountUser = AuthUser & { hasPassword?: boolean; hasGoogle?: boolean };

type AuthResponse = { user: AccountUser; accessToken: string; refreshToken: string };

// Credential endpoints go through a bare client, not `api`: they need no
// bearer token, and a 401 here means "wrong password", which the shared
// interceptor would otherwise treat as an expired session to refresh.
const publicApi = axios.create({ baseURL: API_URL, timeout: 15_000 });

export async function signup(input: { name: string; email: string; password: string }) {
  const { data } = await publicApi.post<AuthResponse>("/auth/signup", input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await publicApi.post<AuthResponse>("/auth/login", input);
  return data;
}

/** "Continuar com Google": `credential` is the ID token handed over by
 * Google Identity Services. */
export async function loginWithGoogle(credential: string) {
  const { data } = await publicApi.post<AuthResponse & { isNewUser: boolean }>("/auth/google", { credential });
  return data;
}

export async function logout(refreshToken: string) {
  await api.post("/auth/logout", { refreshToken });
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AccountUser }>("/auth/me");
  return data.user;
}

export async function updateProfile(input: { name: string }) {
  const { data } = await api.patch<{ user: AccountUser }>("/auth/me", input);
  return data.user;
}

/** Sets or changes the password. The API signs out every other session and
 * returns a fresh token pair for this one. */
export async function changePassword(input: { currentPassword?: string; newPassword: string }) {
  const { data } = await api.post<AuthResponse>("/auth/password", input);
  return data;
}

export async function requestPasswordReset(email: string) {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(input: { email: string; code: string; password: string }) {
  await api.post("/auth/reset-password", input);
}
