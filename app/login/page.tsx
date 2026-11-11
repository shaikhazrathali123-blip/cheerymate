import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldIcon as ShieldCheck } from "@/components/icons";
import { getSessionUserId } from "@/lib/auth";
import { safeCallback } from "@/lib/session-token";
import { GoogleButton } from "@/components/auth/google-button";
import { Radar, DEMO_DOTS } from "@/components/brand/radar";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  if (await getSessionUserId()) redirect(safeCallback(callbackUrl));

  return (
    <main className="pt-safe mx-auto flex min-h-screen-d max-w-md flex-col px-6 page-glow" style={{ paddingBottom: "calc(var(--safe-bottom) + 1.5rem)" }}>
      <Link href="/" className="mt-4 flex items-center gap-2 text-lg font-extrabold">
        <img src="/icons/icon-192.png" alt="" className="size-8 rounded-xl" /> Cherrymate
      </Link>
      <div className="flex flex-1 flex-col justify-center py-8">
        <Radar dots={DEMO_DOTS} className="max-w-[280px]" />
        <h1 className="mt-8 text-center text-3xl font-extrabold tracking-tight">Find someone you&apos;ll love living with</h1>
        <p className="mt-2 text-center text-muted">Not just someone to split rent with.</p>
      </div>
      {error && (
        <p role="alert" className="mb-3 rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger">
          {error === "cancelled"
            ? "Sign-in was cancelled."
            : error === "config"
              ? "Google sign-in isn't configured yet (GOOGLE_CLIENT_ID / SECRET)."
              : "Sign-in didn't work. Please try again."}
        </p>
      )}
      <GoogleButton callbackUrl={safeCallback(callbackUrl)} />
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck className="size-4" /> We never post anything or show your email to others.
      </p>
    </main>
  );
}
