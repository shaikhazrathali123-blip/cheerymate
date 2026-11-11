"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Briefcase, ChevronUp, GraduationCap } from "lucide-react";
import { HouseIcon as Home, PinBlobIcon as MapPin } from "@/components/icons";
import { Photo } from "@/components/ui/photo";
import { ScoreBadge, VerifiedBadge } from "@/components/ui/misc";
import { cn, formatBudget, formatRupeesShort } from "@/lib/utils";
import type { PublicCard } from "@/types";

export type SwipeDir = "like" | "pass";
export type SwipeCardHandle = { swipe: (dir: SwipeDir) => void };

type Props = {
  card: PublicCard;
  index: number; // 0 = top card
  onSwiped: (dir: SwipeDir) => void;
  onOpen: () => void;
};

const THRESHOLD = 110;

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard({ card, index, onSwiped, onOpen }, ref) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const [photo, setPhoto] = useState(0);
  const elRef = useRef<HTMLDivElement>(null);
  const flying = useRef(false);
  const top = index === 0;

  const fly = (dir: SwipeDir, velocity = 0) => {
    if (flying.current) return;
    flying.current = true;
    const to = (dir === "like" ? 1 : -1) * (window.innerWidth + 200);
    animate(x, to, { type: "tween", duration: 0.28, ease: "easeOut", velocity });
    animate(y, y.get() + 40, { duration: 0.28 });
    setTimeout(() => onSwiped(dir), 220);
  };

  useImperativeHandle(ref, () => ({ swipe: (dir) => fly(dir) }));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > THRESHOLD || velocity.x > 600) return fly("like", velocity.x);
    if (offset.x < -THRESHOLD || velocity.x < -600) return fly("pass", velocity.x);
    if (offset.y < -120 || velocity.y < -700) onOpen(); // swipe up → full profile
    animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  // Tap left/right edges to change photo; tap the middle to open the profile
  const onTap = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const rect = elRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = "clientX" in e ? e.clientX : e.changedTouches?.[0]?.clientX ?? 0;
    const rel = (px - rect.left) / rect.width;
    if (rel < 0.3) setPhoto((p) => Math.max(0, p - 1));
    else if (rel > 0.7) setPhoto((p) => Math.min(card.photos.length - 1, p + 1));
    else onOpen();
  };

  const price = card.lookingType === "has_flat" && card.flat?.rent ? `${formatRupeesShort(card.flat.rent)}/mo rent` : formatBudget(card.budgetMin, card.budgetMax);
  const place = card.lookingType === "has_flat" ? card.flat?.locality : card.localities[0];

  return (
    <motion.div
      ref={elRef}
      className={cn("absolute inset-0 touch-none select-none", !top && "pointer-events-none")}
      style={{ x, y, rotate, zIndex: 10 - index }}
      initial={false}
      animate={{ scale: 1 - index * 0.04, y: index * 14, opacity: index > 2 ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag={top}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      onTap={top ? onTap : undefined}
      role={top ? "group" : undefined}
      aria-label={top ? `${card.name}, ${card.age}. ${card.score}% match. Tap for full profile.` : undefined}
      aria-hidden={!top}
    >
      <div className="pop-lg relative size-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2">
        {/* Photos: all of the top card's photos are mounted so they preload; behind cards load their first */}
        {(top ? card.photos : card.photos.slice(0, 1)).map((src, i) => (
          <Photo
            key={src}
            src={src}
            alt={i === photo ? `${card.name} photo ${i + 1}` : ""}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            priority={top && i === 0}
            className={cn("transition-opacity duration-200", i === photo ? "opacity-100" : "opacity-0")}
            draggable={false}
          />
        ))}

        {/* photo progress */}
        {card.photos.length > 1 && (
          <div className="absolute inset-x-3 top-3 flex gap-1.5">
            {card.photos.map((_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i === photo ? "bg-white" : "bg-white/40")} />
            ))}
          </div>
        )}
        <div className="absolute right-3 top-6">
          <ScoreBadge score={card.score} />
        </div>

        {/* stamps */}
        <motion.span style={{ opacity: likeOpacity }} className="absolute left-5 top-12 -rotate-12 rounded-2xl border border-white/40 bg-[var(--score-high)]/85 px-4 py-1.5 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-wide text-white shadow-[0_0_40px_rgba(34,197,94,.6)] backdrop-blur-md">
          VIBE ✨
        </motion.span>
        <motion.span style={{ opacity: passOpacity }} className="absolute right-5 top-12 rotate-12 rounded-2xl border border-white/40 bg-white/20 px-4 py-1.5 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-wide text-white shadow-[0_0_40px_rgba(255,255,255,.35)] backdrop-blur-md">
          NAH 💨
        </motion.span>

        {/* info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--scrim)] via-[var(--scrim)]/60 to-transparent p-5 pt-24 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[28px] font-extrabold leading-none">
              {card.name}, {card.age}
            </h2>
            <VerifiedBadge verified={card.isVerified} />
            {card.lookingType === "has_flat" && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-bold backdrop-blur-md">
                <Home className="size-3" /> Has a flat
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/85">
            {card.occupation === "student" ? <GraduationCap className="size-4" /> : <Briefcase className="size-4" />}
            {card.organisation || (card.occupation === "student" ? "Student" : "Professional")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="size-4" /> {place ?? "—"} · {price}
          </p>
          {card.reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.reasons.map((r) => (
                <span key={r} className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                  {r}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-white/60">
            <ChevronUp className="size-3.5" /> Swipe up or tap for full profile
          </p>
        </div>
      </div>
    </motion.div>
  );
});
