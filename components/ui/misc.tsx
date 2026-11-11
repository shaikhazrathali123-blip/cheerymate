import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { cn, scoreTone } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-2xl", className)} />;
}

const TONE: Record<string, string> = {
  high: "bg-[var(--score-high)]",
  mid: "bg-[var(--score-mid)]",
  low: "bg-[var(--score-low)]",
};

/** Compatibility % badge. */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[var(--pop-border)] px-2.5 py-0.5 text-xs font-extrabold text-pastel-ink shadow-[var(--pop-shadow-sm)]",
        TONE[scoreTone(score)],
        className,
      )}
      aria-label={`${score}% compatible`}
    >
      {score >= 80 ? "🔥" : score >= 60 ? "✨" : "🙂"} {score}% match
    </span>
  );
}

export function VerifiedBadge({ verified, className }: { verified?: boolean; className?: string }) {
  if (!verified) return null;
  return (
    <BadgeCheck className={cn("size-5 fill-sky-500 text-white", className)} aria-label="Verified" role="img" />
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium glass", className)}>
      {children}
    </span>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pop-soft rounded-[var(--radius-card)] bg-surface p-5", className)} {...props} />;
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-[15px] font-bold text-ink", className)}>{children}</h2>;
}

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  /** string or a react-hook-form FieldError */
  error?: unknown;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  const message = typeof error === "string" ? error : (error as { message?: string } | undefined)?.message;
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-[15px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !message && <p className="text-sm text-muted">{hint}</p>}
      {message && (
        <p role="alert" className="text-sm font-medium text-danger">
          {message}
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border-2 border-line bg-surface px-4 text-base text-ink placeholder:text-muted/70 focus:border-lilac focus:outline-none focus:ring-4 focus:ring-lilac/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[112px] w-full resize-none rounded-2xl border-2 border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-lilac focus:outline-none focus:ring-4 focus:ring-lilac/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full appearance-none rounded-2xl border-2 border-line bg-surface bg-[length:20px] bg-[right_14px_center] bg-no-repeat px-4 pr-10 text-base text-ink focus:border-lilac focus:outline-none focus:ring-4 focus:ring-lilac/25",
        className,
      )}
      style={{
        backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a6a6e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

/** Friendly illustrated empty state (CSS-only illustration — no image downloads). */
export function EmptyState({
  title,
  body,
  action,
  emoji = "🍒",
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="relative mb-6 grid size-40 place-items-center">
        <span className="absolute inset-0 rounded-full bg-[var(--ring-1)]" />
        <span className="absolute inset-5 rounded-full bg-[var(--ring-2)]" />
        <span className="absolute inset-10 rounded-full bg-[var(--ring-3)]" />
        <span className="absolute right-4 top-5 size-3 rounded-full bg-brand shadow-[0_0_14px_var(--brand-glow)]" />
        <span className="absolute bottom-7 left-3 size-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
        <span className="relative animate-wiggle text-5xl" aria-hidden>
          {emoji}
        </span>
      </div>
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-xs text-[15px] text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
