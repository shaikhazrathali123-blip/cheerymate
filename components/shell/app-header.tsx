import Link from "next/link";
import { Avatar } from "@/components/ui/photo";
import { cn } from "@/lib/utils";

/** Screen header from the reference: big title + tagline on the left, avatar (or actions) on the right. */
export function AppHeader({
  title,
  subtitle,
  avatar,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  avatar?: { src?: string | null; name?: string | null };
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pt-safe flex items-start justify-between gap-3 px-5 pb-3", className)}>
      <div className="min-w-0 pt-2">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-2">
        {actions}
        {avatar && (
          <Link href="/profile" aria-label="Your profile" className="rounded-full">
            <Avatar src={avatar.src} name={avatar.name} size={48} ring />
          </Link>
        )}
      </div>
    </header>
  );
}
