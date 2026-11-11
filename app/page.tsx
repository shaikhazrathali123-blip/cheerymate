import Link from "next/link";
import { GhostIcon as EyeOff, HeartIcon as Heart, ShieldIcon as Lock, PinBlobIcon as MapPin, ChatBlobIcon as MessageCircle, ShieldIcon as ShieldCheck, SparkIcon as Sparkles, MeIcon as UserRoundCheck } from "@/components/icons";
import { getSessionUserId } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { Radar, DEMO_DOTS } from "@/components/brand/radar";
import { GoogleButton } from "@/components/auth/google-button";
import { InstallButton } from "@/components/pwa/install-banner";
import { Button } from "@/components/ui/button";

export default async function Landing({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [userId, { deleted }] = await Promise.all([getSessionUserId(), searchParams]);
  const signedIn = !!userId;

  return (
    <div className="page-glow min-h-screen-d">
      {/* Nav */}
      <header className="pt-safe sticky top-0 z-20 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
            <img src="/icons/icon-192.png" alt="" className="size-8 rounded-xl" /> Cherrymate
          </Link>
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/discover">Open app</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      {deleted && (
        <p className="mx-auto mt-4 max-w-md rounded-2xl bg-surface px-4 py-3 text-center text-sm shadow-soft">
          Your account and all your data have been deleted. Take care! 🍒
        </p>
      )}

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="glass mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-brand shadow-soft">
            <Sparkles className="size-4" /> Roommate matching for India
          </p>
          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Find someone you can <span className="funky-text">comfortably live with.</span> <span className="inline-block animate-wiggle">🍒</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Not just someone to split rent with. Match on lifestyle — sleep, food, cleanliness, budget — explore flats nearby, and chat safely before you move in.
          </p>
          <div className="mt-8 max-w-sm space-y-3">
            {signedIn ? (
              <Button asChild size="lg" block>
                <Link href="/discover">Continue to Cherrymate</Link>
              </Button>
            ) : (
              <GoogleButton />
            )}
            <p className="text-sm text-muted">Free · {CITIES.map((c) => c.name).slice(0, 6).join(", ")} & more</p>
          </div>
        </div>
        <Radar dots={DEMO_DOTS} className="max-w-[440px]" />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">How it works</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: UserRoundCheck, t: "Tell us how you live", d: "Sleep schedule, food habits, cleanliness, budget, localities — two minutes, all chips." },
            { icon: Heart, t: "Swipe on compatible people", d: "Every card shows a compatibility score and the top reasons you'd get along." },
            { icon: MessageCircle, t: "Match & talk rent", d: "When it's mutual, chat in real time about rent, deposits and house rules." },
          ].map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="glass rounded-[var(--radius-card)] p-6 shadow-[var(--pop-shadow)]">
              <span className="grid size-12 place-items-center rounded-2xl brand-gradient text-white shadow-[0_0_24px_var(--brand-glow)]">
                <Icon className="size-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-brand">Step {i + 1}</p>
              <h3 className="text-lg font-bold">{t}</h3>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Map preview */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
        <div className="pop-lg relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface-2" aria-hidden>
          {/* stylised map */}
          <svg viewBox="0 0 400 300" className="absolute inset-0 size-full">
            <rect width="400" height="300" fill="var(--surface-2)" />
            <path d="M-10 210 C 80 180, 150 240, 240 200 S 380 150, 420 170 L 420 320 L -10 320 Z" fill="var(--map-water)" />
            <g stroke="var(--line)" strokeWidth="10" fill="none" strokeLinecap="round">
              <path d="M0 80 L400 120" />
              <path d="M120 0 L160 300" />
              <path d="M260 0 L300 300" />
              <path d="M0 160 L400 60" />
            </g>
            <circle cx="200" cy="130" r="90" style={{ fill: "var(--brand)", stroke: "var(--brand)" }} fillOpacity=".08" strokeOpacity=".6" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          {[
            { x: 30, y: 30, s: "women/44" },
            { x: 62, y: 46, s: "men/32" },
            { x: 46, y: 62, s: "women/68" },
          ].map((p) => (
            <span key={p.s} className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--pop-border)] bg-[var(--score-high)] p-[2px] shadow-[var(--pop-shadow-sm)]" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <img src={`https://randomuser.me/api/portraits/${p.s}.jpg`} alt="" className="size-full rounded-full border-2 border-white object-cover" loading="lazy" />
            </span>
          ))}
          <span className="absolute left-[70%] top-[28%] rounded-full bg-[var(--ink)] px-2.5 py-1.5 text-xs font-extrabold text-[var(--bg)] shadow-[0_0_18px_var(--brand-glow)]">🏠 ₹14k</span>
          <span className="absolute left-[24%] top-[70%] grid size-12 place-items-center rounded-full border-2 border-white/80 bg-brand font-extrabold text-white shadow-[0_0_24px_var(--brand-glow)]">24</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Explore people & flats nearby</h2>
          <p className="mt-3 text-lg text-muted">
            A Snap-Map-style view of compatible roommates and rooms around you — with the privacy you&apos;d expect.
          </p>
          <ul className="mt-6 space-y-3">
            <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand" /> Approximate areas only — blurred to ~500 m, never your exact or live location.</li>
            <li className="flex gap-3"><EyeOff className="size-5 shrink-0 text-brand" /> Opt-in and off by default, with one-tap Ghost mode.</li>
            <li className="flex gap-3"><Lock className="size-5 shrink-0 text-brand" /> Women can choose to be visible to women only.</li>
          </ul>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="glass-strong rounded-[var(--radius-card)] p-8 shadow-[var(--pop-shadow-lg)] sm:p-12">
          <ShieldCheck active className="size-11 text-brand" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Safety is built in</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["Only matches can message", "No cold DMs. Both people have to say yes first."],
              ["Block & report instantly", "Blocking hides you from each other everywhere, immediately."],
              ["No exact addresses", "Flats show the locality only. Never pay a deposit before visiting."],
            ].map(([t, d]) => (
              <div key={t}>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 opacity-80">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install + CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Get the app — no app store needed</h2>
        <p className="mt-3 text-muted">Install Cherrymate to your home screen for a full-screen, fast experience with notifications.</p>
        <div className="mt-6 flex justify-center">
          <InstallButton />
        </div>
        {!signedIn && (
          <div className="mx-auto mt-10 max-w-sm">
            <GoogleButton label="Get started with Google" />
          </div>
        )}
      </section>

      <footer className="border-t border-line px-5 py-8 text-center text-sm text-muted" style={{ paddingBottom: "calc(var(--safe-bottom) + 2rem)" }}>
        © {new Date().getFullYear()} Cherrymate · Made for people moving to new cities 🍒
      </footer>
    </div>
  );
}
