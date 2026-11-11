/**
 * DEV ONLY. Another app that ran on this localhost port (e.g. a Vite PWA) can leave a service
 * worker behind that keeps serving its own cached index.html → blank page + MIME errors here.
 */

/** Served for worker URLs: replaces the old worker, wipes caches, unregisters and reloads open tabs. */
export const SELF_DESTRUCT_SW = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: "window" })) client.navigate(client.url);
  })());
});
`;

/** Served for a stale page's module requests (/@vite/client …): cleans up from inside the page. */
export const PAGE_CLEANUP_MODULE = `
(async () => {
  if (sessionStorage.getItem("cm-sw-cleanup")) return; // avoid reload loops
  sessionStorage.setItem("cm-sw-cleanup", "1");
  const regs = await navigator.serviceWorker?.getRegistrations?.() ?? [];
  await Promise.all(regs.map((r) => r.unregister()));
  if (self.caches) for (const k of await caches.keys()) await caches.delete(k);
  console.info("[cherrymate] removed a stale service worker left by another app on this port — reloading");
  location.replace("/");
})();
export {};
`;

const WORKER_PATHS = new Set(["/sw.js", "/dev-sw.js", "/service-worker.js", "/serviceWorker.js", "/registerSW.js"]);
// Vite / vite-plugin-pwa dev URLs a stale cached page requests (this Next app never serves these)
const FOREIGN_MODULE = /^\/(@vite\/|@vite-plugin-pwa\/|@react-refresh|@id\/|@fs\/|node_modules\/\.vite\/|src\/main\.(t|j)sx?$)/;

export function devCleanupResponse(pathname: string): { body: string; worker: boolean } | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (WORKER_PATHS.has(pathname)) return { body: SELF_DESTRUCT_SW, worker: true };
  if (FOREIGN_MODULE.test(pathname)) return { body: PAGE_CLEANUP_MODULE, worker: false };
  return null;
}
