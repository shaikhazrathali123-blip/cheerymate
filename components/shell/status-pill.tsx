import Link from "next/link";
import { cn } from "@/lib/utils";

/** Frosted status pill from the reference: "((•)) Visible closest for 30 min · Edit". */
export function StatusPill({
  icon,
  children,
  action,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: { label: React.ReactNode; href?: string; onClick?: () => void; pressed?: boolean };
  className?: string;
}) {
  const actionCls = "flex min-h-[34px] items-center gap-1 rounded-full px-3 font-bold text-brand";
  return (
    <div className={cn("glass inline-flex items-center gap-2 rounded-full py-1 pl-3.5 pr-1 text-[13px] shadow-soft", !action && "pr-3.5", className)}>
      {icon && <span className="grid place-items-center text-ink-2 [&_svg]:size-[18px]">{icon}</span>}
      <span className="font-semibold text-ink-2">{children}</span>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionCls}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} aria-pressed={action.pressed} className={actionCls}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
