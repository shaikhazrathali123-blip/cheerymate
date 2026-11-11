import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl, pkceChallenge, randomToken } from "@/lib/google-oauth";
import { OAUTH_COOKIE, safeCallback } from "@/lib/session-token";

export const dynamic = "force-dynamic";

/** Step 1: send the user to Google's consent screen. State, nonce and the PKCE verifier live in a short-lived httpOnly cookie. */
export async function GET(req: NextRequest) {
  const callbackUrl = safeCallback(req.nextUrl.searchParams.get("callbackUrl"));
  try {
    const state = randomToken();
    const nonce = randomToken();
    const verifier = randomToken(48);
    const url = buildAuthUrl({ origin: req.nextUrl.origin, state, nonce, challenge: await pkceChallenge(verifier) });

    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, nonce, verifier, callbackUrl }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // must survive the top-level redirect back from Google
      path: "/api/auth",
      maxAge: 10 * 60,
    });
    return res;
  } catch (e) {
    console.error("[auth] start failed", e);
    return NextResponse.redirect(new URL("/login?error=config", req.nextUrl.origin));
  }
}
