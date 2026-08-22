import { api } from "./axios";
import type { AuthUser } from "../store/auth.store";

type AuthResponse = { user: AuthUser; accessToken: string; refreshToken: string };

export async function signup(input: { name: string; email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/signup", input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function logout(refreshToken: string) {
  await api.post("/auth/logout", { refreshToken });
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}
