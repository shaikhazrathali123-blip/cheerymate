"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { latLngSchema } from "@/lib/validators";
import { LOCATION_COOLDOWN_MS, distanceKm, fuzzLocation, newJitter, type Jitter } from "@/lib/geo";
import { getCity } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { User } from "@/models";
import type { ActionResult } from "@/types";

type Fuzzed = { lat: number; lng: number; locality: string | null };

async function getJitter(userId: unknown): Promise<Jitter> {
  const u = await User.findById(userId).select("+locationJitter").lean();
  const j = u?.locationJitter as Jitter | undefined;
  if (j && typeof j.dLat === "number") return j;
  const fresh = newJitter(); // generated once per user, never changes
  await User.updateOne({ _id: userId }, { $set: { locationJitter: fresh } });
  return fresh;
}

function nearestLocality(cityId: string | undefined | null, lat: number, lng: number) {
  const city = getCity(cityId);
  if (!city) return null;
  let best: { name: string; d: number } | null = null;
  for (const l of city.localities) {
    const d = distanceKm([lng, lat], [l.lng, l.lat]);
    if (!best || d < best.d) best = { name: l.name, d };
  }
  return best && best.d < 6 ? best.name : null;
}

async function saveFuzzed(meId: unknown, city: string | undefined | null, lat: number, lng: number, source: "gps" | "manual") {
  const jitter = await getJitter(meId);
  // Precise lat/lng are used only for this computation and then discarded.
  const f = fuzzLocation(lat, lng, jitter);
  const locality = nearestLocality(city, f.lat, f.lng);
  await User.updateOne(
    { _id: meId },
    {
      $set: {
        location: { type: "Point", coordinates: [f.lng, f.lat] },
        locationSource: source,
        locationLocality: locality ?? undefined,
        locationUpdatedAt: new Date(),
      },
    },
  );
  return { lat: f.lat, lng: f.lng, locality };
}

/**
 * GPS update — called when the app is opened (never in the background).
 * Enforces "at most once every 6 hours" unless `force` is set by an explicit user tap.
 */
export async function updateLocation(lat: number, lng: number, force = false): Promise<ActionResult<Fuzzed & { skipped?: boolean }>> {
  try {
    const me = await requireUser();
    const p = latLngSchema.parse({ lat, lng });
    const last = me.locationUpdatedAt ? new Date(me.locationUpdatedAt).getTime() : 0;
    const coords = me.location?.coordinates;
    if (!force && coords?.length && Date.now() - last < LOCATION_COOLDOWN_MS) {
      return { ok: true, data: { lng: coords[0], lat: coords[1], locality: me.locationLocality ?? null, skipped: true } };
    }
    if (force) {
      const rl = await rateLimit(`loc:${me._id}`, 8, 24 * 3600);
      if (!rl.ok) return { ok: false, error: "You've updated your location a lot today. Try again tomorrow." };
    }
    const data = await saveFuzzed(me._id, me.city, p.lat, p.lng, "gps");
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Manual pick on the map (or a locality chip) instead of GPS. */
export async function setManualLocation(lat: number, lng: number): Promise<ActionResult<Fuzzed>> {
  try {
    const me = await requireUser();
    const p = latLngSchema.parse({ lat, lng });
    const rl = await rateLimit(`loc:${me._id}`, 8, 24 * 3600);
    if (!rl.ok) return { ok: false, error: "You've updated your location a lot today. Try again tomorrow." };
    const data = await saveFuzzed(me._id, me.city, p.lat, p.lng, "manual");
    revalidatePath("/settings");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function clearLocation(): Promise<ActionResult> {
  try {
    const me = await requireUser();
    await User.updateOne(
      { _id: me._id },
      { $unset: { location: "", locationUpdatedAt: "", locationLocality: "", locationSource: "" }, $set: { showOnMap: false } },
    );
    revalidatePath("/settings");
    revalidatePath("/map");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const mapSettingsSchema = z.object({
  showOnMap: z.boolean().optional(),
  ghostMode: z.boolean().optional(),
  mapVisibleToWomenOnly: z.boolean().optional(),
});

export async function setMapSettings(input: z.infer<typeof mapSettingsSchema>): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const d = mapSettingsSchema.parse(input);
    if (d.mapVisibleToWomenOnly && me.gender !== "female") delete d.mapVisibleToWomenOnly;
    await User.updateOne({ _id: me._id }, { $set: d });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
