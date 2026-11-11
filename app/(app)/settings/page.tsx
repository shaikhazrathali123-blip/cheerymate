import type { Metadata } from "next";
import Link from "next/link";
import { BackIcon as ChevronLeft } from "@/components/icons";
import { requirePageUser } from "@/lib/session";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requirePageUser();
  return (
    <div className="pb-nav lg:mx-auto lg:max-w-2xl lg:pb-8">
      <header className="pt-safe flex items-center gap-2 px-3 pb-2">
        <Link href="/profile" className="tap grid place-items-center rounded-full" aria-label="Back to profile">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-[26px] font-extrabold tracking-tight">Settings</h1>
      </header>
      <SettingsView
        initial={{
          showOnMap: !!me.showOnMap,
          ghostMode: !!me.ghostMode,
          mapVisibleToWomenOnly: !!me.mapVisibleToWomenOnly,
          notifyMatches: me.notifyMatches !== false,
          notifyMessages: me.notifyMessages !== false,
          hasLocation: !!me.location?.coordinates?.length,
          locationLocality: me.locationLocality ?? null,
          locationUpdatedAt: me.locationUpdatedAt ? new Date(me.locationUpdatedAt).toISOString() : null,
        }}
        isFemale={me.gender === "female"}
        cityId={me.city ?? null}
        email={me.email ?? ""}
      />
    </div>
  );
}
