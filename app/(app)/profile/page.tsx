import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { HouseIcon as Home, GearIcon as Settings, SparkIcon as Sparkles, SlidersIcon as SlidersHorizontal, MeIcon as UserRound } from "@/components/icons";
import { requirePageUser } from "@/lib/session";
import { toPublicCard } from "@/lib/matching";
import { getCity } from "@/lib/constants";
import { AppHeader } from "@/components/shell/app-header";
import { Avatar } from "@/components/ui/photo";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { PauseToggle, PreviewCardButton } from "@/components/profile/profile-actions";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { key: "basics", label: "Basics & photos", icon: UserRound },
  { key: "housing", label: "Housing plan", icon: Home },
  { key: "lifestyle", label: "Lifestyle", icon: Sparkles },
  { key: "preferences", label: "Roommate preferences", icon: SlidersHorizontal },
];

export default async function ProfilePage() {
  const me = await requirePageUser();
  const card = toPublicCard(me, null);

  return (
    <div className="pb-nav lg:mx-auto lg:max-w-2xl lg:pb-8">
      <AppHeader
        title="Profile"
        subtitle="Meet nearby. Stay in control."
        actions={
          <Button asChild variant="glass" size="icon" aria-label="Settings">
            <Link href="/settings">
              <Settings className="size-5" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 px-5">
        <Card className="flex items-center gap-4">
          <Avatar src={card.photos[0]} name={card.name} size={76} ring />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold">
              {card.name}, {card.age}
            </h2>
            <p className="truncate text-sm text-muted">
              {getCity(card.city)?.name} · {card.lookingType === "has_flat" ? "Has a flat" : "Looking for a flat"}
            </p>
            <PreviewCardButton card={card} />
          </div>
        </Card>

        <PauseToggle initial={!!me.isPaused} />

        <Card className="p-2">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link key={key} href={`/profile/edit?section=${key}`} className="flex min-h-[56px] items-center gap-3 rounded-2xl px-3 active:bg-surface-2">
              <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <span className="flex-1 font-semibold">{label}</span>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          ))}
        </Card>

        {/* Verified badge placeholder — college/work email verification coming soon */}
        <Card className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-6 shrink-0 fill-sky-500 text-white" />
          <div>
            <p className="font-semibold">{me.isVerified ? "You're verified" : "Get verified (coming soon)"}</p>
            <p className="text-sm text-muted">Verify with your college or work email to earn a badge and build trust.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
