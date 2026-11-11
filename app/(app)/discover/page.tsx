import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { getDiscoverCards } from "@/lib/discover";
import { getCity } from "@/lib/constants";
import { AppHeader } from "@/components/shell/app-header";
import { SwipeDeck } from "@/components/discover/swipe-deck";
import { StatusPill } from "@/components/shell/status-pill";
import { SignalIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const me = await requirePageUser();
  const cards = await getDiscoverCards(me);
  const city = getCity(me.city);

  return (
    <div className="flex h-screen-d flex-col pb-nav lg:pb-6">
      <AppHeader
        title="Discover"
        subtitle={`Roommates in ${city?.name ?? "your city"} · Live comfortably.`}
        avatar={{ src: me.photos?.[0]?.url ?? me.image, name: me.name }}
      />
      <div className="mb-3 flex justify-center px-5">
        <StatusPill icon={<SignalIcon className="text-brand" />} action={{ label: "Edit", href: "/profile/edit?section=preferences" }}>
          Matching in {city?.name ?? "your city"}
        </StatusPill>
      </div>
      {me.isPaused && (
        <p className="mx-5 mb-3 rounded-2xl bg-warning/15 px-4 py-2.5 text-sm font-medium text-ink">
          Your profile is paused — others can&apos;t see you. Unpause in Profile.
        </p>
      )}
      <SwipeDeck initialCards={cards} cityId={me.city ?? ""} />
    </div>
  );
}
