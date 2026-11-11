"use client";
import { Briefcase, CalendarDays, GraduationCap, IndianRupee, Languages } from "lucide-react";
import { HouseIcon as Home, PinBlobIcon as MapPin, SparkIcon as Sparkles } from "@/components/icons";
import { Photo } from "@/components/ui/photo";
import { ScoreBadge, VerifiedBadge } from "@/components/ui/misc";
import { FURNISHING, LIFESTYLE, ROOM_TYPES, getCity } from "@/lib/constants";
import { formatBudget, formatMoveIn, formatRupees } from "@/lib/utils";
import type { PublicCard } from "@/types";

/** Full profile body — used in bottom sheets (Discover, Map, Chat header) and the "preview my card" view. */
export function ProfileDetails({ card, showScore = true }: { card: PublicCard; showScore?: boolean }) {
  const city = getCity(card.city);
  const furnishing = FURNISHING.find((f) => f.value === card.flat?.furnishing)?.label;
  const room = ROOM_TYPES.find((r) => r.value === card.roomType)?.label;

  return (
    <div className="space-y-6 pb-4">
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5">
        {card.photos.map((src, i) => (
          <div key={src} className="relative aspect-[3/4] w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl bg-surface-2">
            <Photo src={src} alt={`${card.name} photo ${i + 1}`} fill sizes="80vw" />
          </div>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-extrabold">
            {card.name}, {card.age}
          </h2>
          <VerifiedBadge verified={card.isVerified} />
          {showScore && card.score > 0 && <ScoreBadge score={card.score} />}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-muted">
          {card.occupation === "student" ? <GraduationCap className="size-4" /> : <Briefcase className="size-4" />}
          {card.occupation === "student" ? "Student" : "Working professional"}
          {card.organisation && ` · ${card.organisation}`}
        </p>
        {card.distanceLabel && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4" /> {card.distanceLabel} away
          </p>
        )}
      </div>

      {card.reasons.length > 0 && (
        <section className="rounded-3xl bg-brand-soft p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-brand">
            <Sparkles className="size-4" /> Top reasons you&apos;d get along
          </h3>
          <ul className="space-y-1 text-[15px] text-ink">
            {card.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </section>
      )}

      {card.bio && <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{card.bio}</p>}

      <section className="grid grid-cols-2 gap-3">
        <Info icon={<Home className="size-4" />} label="Looking for" value={card.lookingType === "has_flat" ? "A roommate" : "Flat + roommate"} />
        <Info icon={<IndianRupee className="size-4" />} label="Budget" value={formatBudget(card.budgetMin, card.budgetMax) || "—"} />
        <Info icon={<CalendarDays className="size-4" />} label="Move-in" value={formatMoveIn(card.moveInDate) || "Flexible"} />
        <Info icon={<MapPin className="size-4" />} label="Prefers" value={card.localities.slice(0, 2).join(", ") || city?.name || "—"} />
        {room && <Info icon={<Home className="size-4" />} label="Room" value={room} />}
        {card.languages.length > 0 && <Info icon={<Languages className="size-4" />} label="Speaks" value={card.languages.slice(0, 3).join(", ")} />}
      </section>

      {card.flat && (
        <section className="space-y-3 rounded-3xl border border-line bg-surface p-4">
          <h3 className="font-bold">Their flat{card.flat.locality ? ` in ${card.flat.locality}` : ""}</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {card.flat.rent && <span className="rounded-full bg-surface-2 px-3 py-1.5 font-semibold">Rent {formatRupees(card.flat.rent)}/mo</span>}
            {card.flat.deposit != null && <span className="rounded-full bg-surface-2 px-3 py-1.5">Deposit {formatRupees(card.flat.deposit)}</span>}
            {furnishing && <span className="rounded-full bg-surface-2 px-3 py-1.5">{furnishing}</span>}
          </div>
          {card.flat.photos.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {card.flat.photos.map((src, i) => (
                <div key={src} className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                  <Photo src={src} alt={`Flat photo ${i + 1}`} fill sizes="192px" />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">Exact address is never shared. Visit in person before paying anything.</p>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-bold">Lifestyle</h3>
        <div className="flex flex-wrap gap-2">
          {LIFESTYLE.map((q) => {
            const v = q.options.find((o) => o.value === card.lifestyle[q.key as keyof typeof card.lifestyle]);
            if (!v) return null;
            return (
              <span key={q.key} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
                <span aria-hidden>{q.emoji}</span> {v.label}
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon} {label}
      </p>
      <p className="mt-0.5 truncate font-semibold text-ink">{value}</p>
    </div>
  );
}
