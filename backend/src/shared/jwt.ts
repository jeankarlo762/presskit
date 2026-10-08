import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

// Pinning issuer + audience means a token minted by any other service that
// happens to share this secret (or a future second audience of this API)
// is rejected here instead of silently accepted.
const ISSUER = "presskit-api";
const AUDIENCE = "presskit-dashboard";

export class InvalidAccessTokenError extends Error {
  constructor() {
    super("Token de acesso inválido ou expirado");
    this.name = "InvalidAccessTokenError";
  }
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string") throw new InvalidAccessTokenError();
    return { userId: payload.sub };
  } catch {
    throw new InvalidAccessTokenError();
  }
}
