import { SignJWT, jwtVerify } from "jose";

/**
 * Our own session: an HS256-signed JWT in an httpOnly cookie.
 * Edge-safe (no Node APIs) so middleware can verify it without a DB round-trip.
 */
export const SESSION_COOKIE = "cm_session";
export const OAUTH_COOKIE = "cm_oauth";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters). Generate: openssl rand -base64 32");
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer("cherrymate")
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** Returns the user id, or null if the token is missing, expired or tampered with. */
export async function verifySession(token?: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "cherrymate", algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** Only allow same-site relative redirects ("/discover"), never "//evil.com" or absolute URLs. */
export function safeCallback(url?: string | null) {
  return url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : "/discover";
}
