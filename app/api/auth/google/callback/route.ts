import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { exchangeCode } from "@/lib/google-oauth";
import { connectDB } from "@/lib/db";
import { OAUTH_COOKIE, SESSION_COOKIE, safeCallback, sessionCookieOptions, signSession } from "@/lib/session-token";
import { User } from "@/models";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Step 2: Google redirects back here with ?code&state. Verify, upsert the user, set our session cookie. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${code}`, origin));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (req.nextUrl.searchParams.get("error")) return fail("cancelled"); // user pressed "Cancel"

  let stored: { state: string; nonce: string; verifier: string; callbackUrl: string };
  try {
    stored = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? "");
  } catch {
    return fail("expired");
  }
  if (!code || !state || !stored?.state || !same(state, stored.state)) return fail("state"); // CSRF protection

  try {
    const g = await exchangeCode({ origin, code, verifier: stored.verifier, nonce: stored.nonce });
    await connectDB();

    // Find by Google id; otherwise link an existing account with the same verified email; otherwise create.
    let user = await User.findOne({ googleId: g.sub }, { _id: 1, image: 1 }).lean();
    if (!user) {
      user = await User.findOneAndUpdate(
        { email: g.email },
        {
          $set: { googleId: g.sub, emailVerified: new Date() },
          $setOnInsert: { email: g.email, name: g.name, image: g.picture },
        },
        { upsert: true, new: true, projection: { _id: 1, image: 1 } },
      ).lean();
    } else if (g.picture && !user.image) {
      await User.updateOne({ _id: user._id }, { $set: { image: g.picture } });
    }
    if (!user) return fail("server");

    const res = NextResponse.redirect(new URL(safeCallback(stored.callbackUrl), origin));
    res.cookies.set(SESSION_COOKIE, await signSession(String(user._id)), sessionCookieOptions);
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  } catch (e) {
    console.error("[auth] callback failed", e);
    return fail("google");
  }
}
