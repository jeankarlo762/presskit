import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { geolocation } from "@vercel/functions";
import { SERVER_API_URL } from "./lib/urls";

const SESSION_COOKIE = "presskit_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

// Hosts that are "us" — anything else is a candidate artist domain.
const OWN_HOST_SUFFIXES = ["presskitai.com.br", "up.railway.app", "railway.internal", "localhost", "127.0.0.1"];

function isOwnHost(host: string): boolean {
  const bare = host.replace(/:\d+$/, "").toLowerCase();
  return OWN_HOST_SUFFIXES.some((suffix) => bare === suffix || bare.endsWith(`.${suffix}`));
}

/** Artist custom domain → slug, via the API. Cached per host for 5 min so
 * a busy page costs one lookup, not one per visitor. */
async function resolveCustomDomain(host: string): Promise<string | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}/public/domains/${encodeURIComponent(host)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { slug?: string };
    return body.slug ?? null;
  } catch {
    return null;
  }
}

/** Server Components can't read Vercel's geolocation directly (no raw
 * Request available), and can't mint a stable per-visitor id either — proxy
 * is the one place that has both the raw request and the ability to set a
 * cookie, so it resolves them once and forwards both as request headers for
 * the page to read via headers(). Off Vercel, geo resolves to undefined and
 * the header is simply absent — analytics country stays optional either
 * way. The session id is what makes "unique visitors" (vs. raw page views)
 * countable at all: without a stable id, every request looked like a new
 * visitor.
 *
 * It is also where an artist's own domain (artista.com.br) turns into the
 * presskit route: the host is looked up and the request rewritten to
 * /<slug>, so the address bar keeps the artist's domain. */
export default async function proxy(request: NextRequest) {
  const { country } = geolocation(request);
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  if (country) requestHeaders.set("x-geo-country", country);
  requestHeaders.set("x-session-id", sessionId);

  const host = request.headers.get("host") ?? "";
  let response: NextResponse;

  if (host && !isOwnHost(host) && request.nextUrl.pathname === "/") {
    const slug = await resolveCustomDomain(host.replace(/:\d+$/, "").toLowerCase());
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${slug}`;
      requestHeaders.set("x-custom-domain", "1");
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!request.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
