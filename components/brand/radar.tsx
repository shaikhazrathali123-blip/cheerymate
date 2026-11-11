import { cn } from "@/lib/utils";
import { CherryOrbitIcon } from "@/components/icons";

type Dot = { src?: string; x: number; y: number; size?: number; label?: string; dim?: boolean };

/**
 * The "Violet Glass" radar (reference design): overlapping glowing blobs that slowly drift,
 * frosted concentric rings, a glowing core and avatars orbiting at different distances.
 * Pure CSS; no JS.
 */
export function Radar({ dots = [], className, pulse = true, core }: { dots?: Dot[]; className?: string; pulse?: boolean; core?: React.ReactNode }) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[360px]", className)} aria-hidden>
      {/* drifting glow blobs (offset, overlapping — like the reference) */}
      <div
        className="absolute inset-[-4%] rounded-[46%_54%_52%_48%/52%_44%_56%_48%] animate-blob opacity-90 blur-[2px]"
        style={{ background: "radial-gradient(closest-side, var(--ring-2), var(--ring-1) 70%, transparent)" }}
      />
      <div
        className="absolute inset-[4%] translate-x-[11%] translate-y-[7%] rounded-[55%_45%_48%_52%/45%_55%_45%_55%] border border-[var(--ring-edge)] animate-blob opacity-90 [animation-delay:-5s] [animation-duration:18s]"
        style={{ background: "radial-gradient(closest-side, var(--ring-3), var(--ring-2) 70%, var(--ring-1))" }}
      />
      <div
        className="absolute inset-[8%] -translate-x-[12%] -translate-y-[5%] rounded-[50%_50%_46%_54%/56%_48%_52%_44%] border border-[var(--ring-edge)] animate-blob opacity-80 [animation-delay:-9s] [animation-duration:22s]"
        style={{ background: "radial-gradient(closest-side, var(--ring-2), var(--ring-1) 80%)" }}
      />

      {/* frosted concentric rings */}
      <div className="absolute inset-[12%] rounded-full border border-[var(--ring-edge)] bg-[var(--ring-1)] backdrop-blur-[2px]" />
      <div className="absolute inset-[22%] rounded-full border border-[var(--ring-edge)] bg-[var(--ring-2)] shadow-[inset_0_0_40px_var(--ring-2)]" />
      <div className="absolute inset-[32%] rounded-full border border-[var(--ring-edge)] bg-[var(--ring-3)] shadow-[0_0_60px_var(--brand-glow)]" />

      {pulse && (
        <>
          <span className="absolute inset-[34%] rounded-full border border-[var(--brand)]/50 animate-radar" />
          <span className="absolute inset-[34%] rounded-full border border-[var(--brand)]/40 animate-radar [animation-delay:1.6s]" />
        </>
      )}

      {/* glowing core */}
      <div className="absolute inset-[40%] grid place-items-center rounded-full bg-[var(--ring-core)] text-[var(--ring-core-ink)] shadow-[0_0_0_6px_var(--ring-3),0_0_50px_var(--brand-glow)]">
        {core ?? <CherryOrbitIcon className="size-[46%] animate-[glow_3s_ease-in-out_infinite]" />}
      </div>

      {dots.map((d, i) => (
        <span
          key={i}
          className={cn(
            "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border-2 border-[var(--ring-edge)] bg-surface-2 shadow-[var(--pop-shadow-sm)] animate-float",
            d.dim && "opacity-45 grayscale",
          )}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size ?? 44, height: d.size ?? 44, animationDelay: `${i * 0.7}s` }}
        >
          {d.src ? <img src={d.src} alt="" className="size-full object-cover" loading="lazy" /> : <span className="text-lg">{d.label ?? "🍒"}</span>}
        </span>
      ))}
    </div>
  );
}

export const DEMO_DOTS: Dot[] = [
  { src: "https://randomuser.me/api/portraits/women/44.jpg", x: 84, y: 14, size: 58 },
  { src: "https://randomuser.me/api/portraits/men/32.jpg", x: 24, y: 22, size: 40 },
  { src: "https://randomuser.me/api/portraits/women/68.jpg", x: 16, y: 52, size: 50 },
  { src: "https://randomuser.me/api/portraits/men/75.jpg", x: 80, y: 48, size: 30 },
  { src: "https://randomuser.me/api/portraits/women/12.jpg", x: 78, y: 76, size: 26, dim: true },
  { src: "https://randomuser.me/api/portraits/men/11.jpg", x: 18, y: 80, size: 30, dim: true },
];
