import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { geolocation } from "@vercel/functions";

/** Server Components can't read Vercel's geolocation directly (no raw
 * Request available) — proxy is the one place that has it, so it forwards
 * the resolved country as a request header for the page to read via
 * headers(). Off Vercel this resolves to undefined and the header is simply
 * absent — analytics country stays optional either way. */
export default function proxy(request: NextRequest) {
  const { country } = geolocation(request);

  const requestHeaders = new Headers(request.headers);
  if (country) requestHeaders.set("x-geo-country", country);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
