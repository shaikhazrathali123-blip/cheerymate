"use client";
import { Download, Share, SquarePlus } from "lucide-react";
import { NopeIcon as X } from "@/components/icons";
import { useInstall } from "@/hooks/use-install";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Floating install prompt shown above the tab bar. */
export function InstallBanner({ className }: { className?: string }) {
  const { shouldShowBanner, canPrompt, ios, install, dismiss } = useInstall();
  if (!shouldShowBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Cherrymate"
      className={cn(
        "glass fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-3xl p-3 pl-4 shadow-card animate-pop lg:bottom-6 lg:left-auto lg:right-6",
        className,
      )}
      style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 1.25rem)" }}
    >
      <img src="/icons/icon-192.png" alt="" className="size-11 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">Install Cherrymate</p>
        {ios && !canPrompt ? (
          <p className="text-sm text-muted">
            Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then{" "}
            <span className="whitespace-nowrap">
              <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> Add to Home Screen
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted">Faster, full-screen, with notifications.</p>
        )}
      </div>
      {canPrompt && (
        <Button size="sm" onClick={install}>
          <Download className="size-4" /> Install
        </Button>
      )}
      <button onClick={dismiss} className="tap grid place-items-center rounded-full text-muted" aria-label="Dismiss install prompt">
        <X className="size-5" />
      </button>
    </div>
  );
}

/** Inline button for the landing page and settings. */
export function InstallButton({ className }: { className?: string }) {
  const { installed, canPrompt, ios, install } = useInstall();
  if (installed) return <p className={cn("text-sm text-muted", className)}>✓ Cherrymate is installed on this device</p>;
  if (canPrompt)
    return (
      <Button onClick={install} variant="dark" className={className}>
        <Download className="size-4" /> Install the app
      </Button>
    );
  return (
    <p className={cn("text-sm text-muted", className)}>
      {ios
        ? "On iPhone: open in Safari, tap Share → Add to Home Screen."
        : "Open in Chrome and choose “Install app” / “Add to Home screen” from the menu."}
    </p>
  );
}
