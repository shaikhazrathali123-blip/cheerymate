import type { Metadata } from "next";
import { RetryButton } from "./retry";

export const metadata: Metadata = { title: "You're offline" };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="pt-safe flex min-h-screen-d flex-col items-center justify-center px-8 text-center page-glow">
      <div className="relative mb-6 grid size-40 place-items-center">
        <span className="absolute inset-0 rounded-full bg-[var(--ring-1)]" />
        <span className="absolute inset-5 rounded-full bg-[var(--ring-2)]" />
        <span className="absolute inset-10 rounded-full bg-[var(--ring-3)]" />
        <span className="relative animate-float text-5xl" aria-hidden>
          📶
        </span>
      </div>
      <h1 className="text-2xl font-extrabold">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-muted">
        No worries — messages you type in a chat will be sent as soon as you&apos;re back online.
      </p>
      <RetryButton />
    </main>
  );
}
