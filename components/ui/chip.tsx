"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; size?: "sm" | "md" };

/** Pill chip — matches the reference "Closest / Nearby / Walkable" chips. */
export function Chip({ active, size = "md", className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold backdrop-blur-xl transition-all active:scale-95",
        size === "md" ? "min-h-[44px] px-4 text-[15px]" : "min-h-[36px] px-3.5 text-sm",
        active
          ? "chip-active border-[var(--glass-border)] shadow-[0_0_20px_var(--brand-glow)]"
          : "border-[var(--glass-border)] bg-[var(--chip-bg)] text-[var(--chip-ink)] shadow-[var(--pop-shadow-sm)] hover:border-brand/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type ChipGroupProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value?: T | T[];
  onChange: (v: T) => void;
  multiple?: boolean;
  size?: "sm" | "md";
  className?: string;
  label?: string;
};

/** Single- or multi-select group of chips with proper a11y semantics. */
export function ChipGroup<T extends string>({ options, value, onChange, multiple, size, className, label }: ChipGroupProps<T>) {
  const isActive = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <Chip
          key={o.value}
          size={size}
          active={isActive(o.value)}
          role={multiple ? undefined : "radio"}
          aria-checked={multiple ? undefined : isActive(o.value)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
