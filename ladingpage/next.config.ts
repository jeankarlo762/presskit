import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

// Players the public presskit page is allowed to frame — must match what
// packages/shared parseMediaUrl can emit as an embedSrc.
const EMBED_FRAME_SOURCES = [
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
  "https://player.vimeo.com",
  "https://open.spotify.com",
  "https://w.soundcloud.com",
];

// Next's app router ships inline bootstrap scripts, so 'unsafe-inline' stays
// for scripts until a nonce-based policy (via proxy.ts) is adopted. React
// `style={}` attributes need it for styles regardless. 'unsafe-eval' is only
// what React dev tooling needs in development.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Gallery photos + theme backgrounds come from the artist's R2 bucket,
  // whose public host is configured per environment.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl}`,
  `frame-src ${EMBED_FRAME_SOURCES.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
