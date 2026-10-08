// Cross-app URLs for the marketing site. NEXT_PUBLIC_* values are inlined
// at build time, so they must be set on the Railway service (not just at
// runtime) for the deployed landing to point at the right dashboard/API.

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/** Browser-side API base (login modal, session restore). */
export const PUBLIC_API_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333");

/** Server-side API base for the public presskit page. Falls back to the
 * public URL; on Railway this can be pointed at the private network
 * (http://backend.railway.internal:PORT) to skip the public hop. */
export const SERVER_API_URL = trimTrailingSlash(process.env.API_URL ?? PUBLIC_API_URL);

export const DASHBOARD_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173");

export const DASHBOARD_SIGNUP_URL = `${DASHBOARD_URL}/signup`;
export const DASHBOARD_LOGIN_URL = `${DASHBOARD_URL}/login`;
