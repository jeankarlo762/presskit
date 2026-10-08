// Every cross-app URL the dashboard emits comes from here, so the three
// deployments (API, dashboard, public site) can move hosts independently
// by changing env vars — nothing about "presskit.com.br" is hardcoded.

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_URL = trimTrailingSlash(import.meta.env.VITE_API_URL ?? "http://localhost:3333");

/** Where the public presskit pages live (the Next.js "ladingpage" app). */
export const SITE_URL = trimTrailingSlash(import.meta.env.VITE_SITE_URL ?? "http://localhost:3000");

/** Host shown next to the slug in the editor, e.g. "presskit.ai". */
export const SITE_HOST = new URL(SITE_URL).host;

export function publicPresskitUrl(slug: string, trackableCode?: string) {
  const url = new URL(`/${encodeURIComponent(slug)}`, SITE_URL);
  if (trackableCode) url.searchParams.set("ref", trackableCode);
  return url.toString();
}
