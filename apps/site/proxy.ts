import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { geolocation } from "@vercel/functions";

const SESSION_COOKIE = "presskit_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/** Server Components can't read Vercel's geolocation directly (no raw
 * Request available), and can't mint a stable per-visitor id either — proxy
 * is the one place that has both the raw request and the ability to set a
 * cookie, so it resolves them once and forwards both as request headers for
 * the page to read via headers(). Off Vercel, geo resolves to undefined and
 * the header is simply absent — analytics country stays optional either
 * way. The session id is what makes "unique visitors" (vs. raw page views)
 * countable at all: without a stable id, every request looked like a new
 * visitor. */
export default function proxy(request: NextRequest) {
  const { country } = geolocation(request);
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  if (country) requestHeaders.set("x-geo-country", country);
  requestHeaders.set("x-session-id", sessionId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

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
