"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChatBlobIcon, MeIcon, PinBlobIcon, RadarIcon, WaveIcon, type IconProps } from "@/components/icons";
import { useRealtime } from "./realtime-provider";
import { cn } from "@/lib/utils";

export const TABS: { href: string; label: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { href: "/discover", label: "Discover", icon: RadarIcon },
  { href: "/map", label: "Nearby", icon: PinBlobIcon },
  { href: "/matches", label: "Matches", icon: WaveIcon },
  { href: "/chat", label: "Chat", icon: ChatBlobIcon },
  { href: "/profile", label: "Me", icon: MeIcon },
];

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/") || (href === "/profile" && path.startsWith("/settings"));
}

function Badge({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-extrabold leading-[18px] text-[#0f0b16] shadow-[0_0_12px_var(--brand-glow)]",
        className,
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

/**
 * Mobile: floating frosted-glass bar (reference design). Inactive tabs are icon-only;
 * the active tab grows into a pill with its label. Hidden ≥1024px.
 */
export function BottomNav() {
  const isActive = useActive();
  const { unread } = useRealtime();
  const path = usePathname();
  if (/^\/chat\/[^/]+/.test(path)) return null; // the chat composer owns the bottom edge

  return (
    <nav aria-label="Main" className="bottom-nav fixed inset-x-3 z-40 mx-auto max-w-md lg:hidden">
      <ul className="glass flex items-center gap-1 rounded-full p-1.5 shadow-nav">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const badge = href === "/chat" && unread > 0 ? unread : 0;
          return (
            <motion.li key={href} layout className={cn("relative", active ? "flex-[1.9]" : "flex-1")} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
              <Link
                href={href}
                aria-label={badge ? `${label}, ${badge} unread` : label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 items-center justify-center gap-2 rounded-full text-[13px] font-bold transition-colors",
                  active ? "text-[var(--nav-active-ink)]" : "text-ink-2/80",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="nav-active absolute inset-0 rounded-full shadow-[0_0_24px_var(--brand-glow)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">
                  <Icon active={active} className="size-[24px]" strokeWidth={active ? 2.1 : 1.9} />
                  {badge > 0 && <Badge n={badge} className="absolute -right-2.5 -top-2" />}
                </span>
                {active && (
                  <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="relative">
                    {label}
                  </motion.span>
                )}
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop: frosted left sidebar. */
export function SideNav() {
  const isActive = useActive();
  const { unread } = useRealtime();
  return (
    <aside className="glass sticky top-0 hidden h-screen-d w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-6 lg:flex">
      <Link href="/discover" className="mb-8 flex items-center gap-2.5 px-3">
        <img src="/icons/icon-192.png" alt="" className="size-9 rounded-xl" />
        <span className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">Cherrymate</span>
      </Link>
      <nav aria-label="Main">
        <ul className="space-y-1">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const badge = href === "/chat" && unread > 0 ? unread : 0;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-full px-4 font-bold transition-colors",
                    active ? "nav-active shadow-[0_0_24px_var(--brand-glow)]" : "text-ink-2 hover:bg-[var(--glass)]",
                  )}
                >
                  <Icon active={active} className="size-[22px]" />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && <Badge n={badge} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="mt-auto px-3 text-xs text-muted">Meet nearby. Stay in control.</p>
    </aside>
  );
}
