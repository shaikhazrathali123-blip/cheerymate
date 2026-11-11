"use client";
import { useCallback, useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "cm-install-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Install state for our custom banner / settings button. */
export function useInstall() {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissedRecently, setDismissedRecently] = useState(true);

  useEffect(() => {
    const update = () => force((n) => n + 1);
    listeners.add(update);
    setInstalled(isStandalone());
    setIos(isIOS());
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      setDismissedRecently(Date.now() - at < DISMISS_MS);
    } catch {
      setDismissedRecently(false);
    }
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    force((n) => n + 1);
    return outcome === "accepted";
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissedRecently(true);
  }, []);

  return {
    installed,
    ios,
    canPrompt: !!deferred,
    // Android/Chrome with a captured prompt, or iOS Safari (manual guide)
    shouldShowBanner: !installed && !dismissedRecently && (!!deferred || ios),
    install,
    dismiss,
  };
}
