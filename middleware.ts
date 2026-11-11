import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";
import { devCleanupResponse } from "@/lib/dev-sw-cleanup";

const PUBLIC_PATHS = ["/", "/login", "/offline"];

/** Protects every route except /, /login, /offline and the Google OAuth endpoints. */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Dev only: evict service workers left on this port by other apps (see lib/dev-sw-cleanup.ts)
  const cleanup = devCleanupResponse(pathname);
  if (cleanup) {
    return new NextResponse(cleanup.body, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        ...(cleanup.worker ? { "Service-Worker-Allowed": "/" } : {}),
      },
    });
  }

  // Worker scripts must never be redirected to /login (the real Serwist /sw.js in production)
  if (pathname.endsWith(".js")) return NextResponse.next();
  // Browser/DevTools probes (e.g. /.well-known/appspecific/com.chrome.devtools.json) — just 404, no login redirect
  if (pathname.startsWith("/.well-known/")) return NextResponse.next();

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/")) return NextResponse.next();

  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (userId) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("callbackUrl", pathname + search);
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE); // drop an expired/invalid cookie
  return res;
}

export const config = {
  // Skip Next internals, the service worker, manifest and static files.
  matcher: [
    // Worker script URLs (dev cleanup only — in production these pass straight through)
    "/sw.js",
    "/dev-sw.js",
    "/service-worker.js",
    "/serviceWorker.js",
    "/registerSW.js",
    "/((?!_next/static|_next/image|sw.js|swe-worker|workbox-|manifest.webmanifest|icons/|splash/|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico|js|css|txt|woff2?)$).*)",
  ],
};
