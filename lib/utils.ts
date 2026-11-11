import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ₹12,000 → "₹12k" */
export function formatRupeesShort(n?: number | null) {
  if (n == null) return "";
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
}

export function formatRupees(n?: number | null) {
  if (n == null) return "";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatBudget(min?: number, max?: number) {
  if (!min && !max) return "";
  return `${formatRupeesShort(min)}–${formatRupeesShort(max)}/mo`;
}

export function formatTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function formatRelative(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yest.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function formatMoveIn(d?: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (date.getTime() <= Date.now()) return "Immediately";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Light haptic feedback (Android). Fails silently elsewhere. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* noop */
  }
}

export function scoreTone(score: number) {
  if (score >= 80) return "high" as const;
  if (score >= 60) return "mid" as const;
  return "low" as const;
}

export function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Insert Cloudinary transformations so cards / pins / lists download tiny WebP/AVIF files. */
export function cldUrl(url: string | undefined | null, width: number, opts: { square?: boolean } = {}) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const t = [`f_auto`, `q_auto`, `w_${width}`, opts.square ? `h_${width},c_fill,g_face` : `c_limit`, `dpr_auto`].join(",");
  return url.replace("/upload/", `/upload/${t}/`);
}
