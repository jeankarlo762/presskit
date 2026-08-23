import type { PublicPresskit } from "@presskit/shared";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

export type PresskitLookup =
  | { status: "found"; presskit: PublicPresskit }
  | { status: "moved"; slug: string }
  | { status: "not_found" };

export async function fetchPublicPresskit(slug: string): Promise<PresskitLookup> {
  const res = await fetch(`${API_URL}/public/presskits/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (res.status === 404) return { status: "not_found" };
  if (!res.ok) throw new Error(`Falha ao buscar presskit: ${res.status}`);

  const body = (await res.json()) as { presskit?: PublicPresskit; movedTo?: string };
  if (body.movedTo) return { status: "moved", slug: body.movedTo };
  if (body.presskit) return { status: "found", presskit: body.presskit };
  return { status: "not_found" };
}

export async function recordPresskitView(
  slug: string,
  input: { trackableCode?: string; referrerUrl?: string; sessionId: string; country?: string },
  userAgent: string | null,
) {
  await fetch(`${API_URL}/public/presskits/${encodeURIComponent(slug)}/view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userAgent ? { "User-Agent": userAgent } : {}),
    },
    body: JSON.stringify(input),
    cache: "no-store",
  }).catch(() => undefined);
}
