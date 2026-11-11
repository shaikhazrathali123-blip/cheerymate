"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Registers the Serwist worker and shows "New version available — Refresh" when an update is waiting. */
export function SWRegister() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev the worker is disabled. Remove any worker + caches left over from a production
    // build on this origin, otherwise it serves a stale app shell (blank page after rebuilds).
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        if (!regs.length) return;
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
        console.info("[cherrymate] removed stale service worker — reloading");
        window.location.reload();
      });
      return;
    }

    let refreshing = false;

    const promptUpdate = (worker: ServiceWorker) => {
      toast("New version available", {
        id: "sw-update",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => worker.postMessage({ type: "SKIP_WAITING" }),
        },
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Notification clicks can ask an open window to navigate
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "NAVIGATE" && typeof e.data.url === "string") router.push(e.data.url);
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          nw?.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) promptUpdate(nw);
          });
        });
        // Check for updates when the app comes back to the foreground
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch((e) => console.warn("SW registration failed", e));
  }, [router]);

  return null;
}
