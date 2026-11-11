"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";

const TRIGGER = 72;

/** Pull-to-refresh for lists (refreshes Server Component data). Touch only; no hover reliance. */
export function PullToRefresh({ children, onRefresh }: { children: React.ReactNode; onRefresh?: () => Promise<void> | void }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [pending, startTransition] = useTransition();
  const start = useRef<number | null>(null);

  const refresh = async () => {
    if (onRefresh) await onRefresh();
    startTransition(() => router.refresh());
  };

  return (
    <div
      onTouchStart={(e) => {
        start.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
      }}
      onTouchMove={(e) => {
        if (start.current == null) return;
        const d = e.touches[0].clientY - start.current;
        setPull(d > 0 ? Math.min(110, d * 0.5) : 0);
      }}
      onTouchEnd={() => {
        if (pull >= TRIGGER) refresh();
        setPull(0);
        start.current = null;
      }}
    >
      <div
        className="flex items-end justify-center overflow-hidden text-muted transition-[height] duration-200"
        style={{ height: pending ? 48 : pull }}
        aria-live="polite"
      >
        {pending ? (
          <Loader2 className="mb-3 size-5 animate-spin text-brand" aria-label="Refreshing" />
        ) : pull > 10 ? (
          <ArrowDown className="mb-3 size-5 transition-transform" style={{ transform: `rotate(${pull >= TRIGGER ? 180 : 0}deg)` }} />
        ) : null}
      </div>
      {children}
    </div>
  );
}
