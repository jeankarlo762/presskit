export type SiteUser = {
  id: string;
  name: string;
  email: string;
  planKey: "FREE" | "PRO";
  avatarUrl: string | null;
};

type AuthResponse = { user: SiteUser; accessToken: string; refreshToken: string };

// Client-side only: this file is imported from "use client" components and
// calls the API directly from the browser (cross-origin — the landing page
// and the API run on different Railway services), unlike lib/api.ts which
// runs server-side for the public presskit page.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function readErrorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}`;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function fetchMe(accessToken: string): Promise<{ user: SiteUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function logout(refreshToken: string) {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => undefined);
}

export async function requestAvatarUploadUrl(accessToken: string, extension: string) {
  const res = await fetch(`${API_URL}/auth/me/avatar/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ extension }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<{ uploadUrl: string; storageKey: string; publicUrl: string }>;
}

export async function uploadAvatarFile(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!res.ok) throw new Error("Falha ao enviar a imagem");
}

export async function confirmAvatar(accessToken: string, input: { storageKey: string; url: string }) {
  const res = await fetch(`${API_URL}/auth/me/avatar/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<{ user: SiteUser }>;
}
