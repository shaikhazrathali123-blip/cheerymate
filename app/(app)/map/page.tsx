import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { getCity } from "@/lib/constants";
import { MapScreen } from "@/components/map/map-screen";

export const metadata: Metadata = { title: "Nearby map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const me = await requirePageUser();
  const city = getCity(me.city);
  const coords = me.location?.coordinates;

  return (
    <MapScreen
      cityId={me.city ?? ""}
      cityCenter={city?.center ?? [77.5946, 12.9716]}
      myPoint={coords?.length === 2 ? [coords[0], coords[1]] : null}
      myPhoto={me.photos?.[0]?.url ?? ""}
      showOnMap={!!me.showOnMap}
      ghostMode={!!me.ghostMode}
      locationSource={me.locationSource ?? null}
    />
  );
}
