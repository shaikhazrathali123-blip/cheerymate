/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, CacheableResponsePlugin, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST, // app shell + static assets
  skipWaiting: false, // we ask the user first ("New version available — Refresh")
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache auth or realtime auth
    { matcher: ({ url }) => url.pathname.startsWith("/api/auth/") || url.pathname.startsWith("/api/pusher"), handler: new NetworkOnly() },
    // Cloudinary + avatar images: cache-first with expiry
    {
      matcher: ({ url }) => ["res.cloudinary.com", "lh3.googleusercontent.com", "randomuser.me"].includes(url.hostname),
      handler: new CacheFirst({
        cacheName: "profile-images",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
        ],
      }),
    },
    // Map tiles, glyphs, sprites
    {
      matcher: ({ url }) => /(^|\.)openfreemap\.org$|(^|\.)maptiler\.com$/.test(url.hostname),
      handler: new CacheFirst({
        cacheName: "map-tiles",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 14, purgeOnQuotaError: true }),
        ],
      }),
    },
    // API data: network-first, short-lived fallback
    {
      matcher: ({ url, request, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/") && request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "api",
        networkTimeoutSeconds: 8,
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 })],
      }),
    },
    ...defaultCache, // network-first for pages / RSC payloads, cache-first for static assets
  ],
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();

/* --------------------------- Update flow --------------------------- */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

/* ------------------------ Push notifications ------------------------ */
type PushPayload = { title: string; body: string; url: string; tag?: string; matchId?: string; icon?: string };

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data: PushPayload;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    (async () => {
      // Skip "new message" notifications if the user is looking at that exact chat.
      if (data.matchId) {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        const inChat = windows.some(
          (w) => w.visibilityState === "visible" && new URL(w.url).pathname === `/chat/${data.matchId}`,
        );
        if (inChat) return;
      }
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon ?? "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: data.tag,
        data: { url: data.url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) ?? "/matches";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          await w.focus();
          await (w as WindowClient).navigate(target).catch(() => w.postMessage({ type: "NAVIGATE", url: target }));
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
