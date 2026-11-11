import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Plain Google OAuth 2.0 / OpenID Connect — authorization code flow with PKCE.
 * Docs: https://developers.google.com/identity/openid-connect/openid-connect
 */
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleProfile = { sub: string; email: string; name: string; picture?: string };

function creds() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set");
  return { id, secret };
}

/** Must exactly match an "Authorised redirect URI" in Google Cloud Console. */
export function redirectUri(origin: string) {
  return `${process.env.APP_URL?.replace(/\/$/, "") || origin}/api/auth/google/callback`;
}

const b64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export function buildAuthUrl(opts: { origin: string; state: string; nonce: string; challenge: string }) {
  const p = new URLSearchParams({
    client_id: creds().id,
    redirect_uri: redirectUri(opts.origin),
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    nonce: opts.nonce,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTH_URL}?${p}`;
}

/** Exchanges the code and verifies Google's signed ID token (signature, issuer, audience, expiry, nonce). */
export async function exchangeCode(opts: { origin: string; code: string; verifier: string; nonce: string }): Promise<GoogleProfile> {
  const { id, secret } = creds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opts.code,
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri(opts.origin),
      grant_type: "authorization_code",
      code_verifier: opts.verifier,
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as { id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.id_token) throw new Error(data.error_description ?? data.error ?? "Token exchange failed");

  const { payload } = await jwtVerify(data.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: id,
  });
  if (payload.nonce !== opts.nonce) throw new Error("Nonce mismatch");
  if (!payload.email || payload.email_verified !== true) throw new Error("Google email is not verified");

  return {
    sub: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: String(payload.name ?? payload.given_name ?? "").trim(),
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
