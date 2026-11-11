"use client";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  className?: string;
};

export function Switch({ checked, onCheckedChange, disabled, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50",
        checked ? "bg-brand" : "bg-line",
        className,
      )}
    >
      <span
        className={cn(
          "block size-6 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

/** A full-width settings row: title + description + switch. */
export function SwitchRow({
  title,
  description,
  ...props
}: SwitchProps & { title: string; description?: string }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <Switch {...props} />
    </div>
  );
}
