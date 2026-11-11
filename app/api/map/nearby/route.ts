import { NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { AuthError, requireUser } from "@/lib/session";
import { nearbyQuerySchema } from "@/lib/validators";
import { buildCandidateQuery, CARD_PROJECTION, compatibility, getExcludedIds } from "@/lib/matching";
import { distanceKm, roundedDistanceLabel } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";
import { LIMITS } from "@/lib/constants";
import { formatBudget, formatRupeesShort } from "@/lib/utils";
import { User, type UserDoc } from "@/models";
import type { MapFeatureProps } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/map/nearby?lat=&lng=&radius=&layer=
 * $geoNear on the 2dsphere index over FUZZED points only. Max 200 results, public card fields only.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser();
    const rl = await rateLimit(`map:${me._id}`, LIMITS.mapQueriesPerMinute, 60);
    if (!rl.ok) return NextResponse.json({ error: "Too many map requests — slow down a little." }, { status: 429 });

    const parsed = nearbyQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Bad query" }, { status: 400 });
    const { lat, lng, radius, layer, ...filters } = parsed.data;

    const excluded = await getExcludedIds(me._id);
    const query = buildCandidateQuery(me, excluded, { forMap: true, filters });
    if (layer === "people") (query.$and as object[]).push({ lookingType: "needs_flat" });
    if (layer === "flats") (query.$and as object[]).push({ lookingType: "has_flat" });

    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "dist",
          maxDistance: radius * 1000,
          spherical: true,
          query,
          key: "location",
        },
      },
      { $limit: 200 },
      { $project: { ...CARD_PROJECTION } },
    ];
    const users = await User.aggregate<UserDoc>(pipeline);

    // Distances are always measured between fuzzed points, and rounded.
    const origin: [number, number] = me.location?.coordinates?.length === 2
      ? [me.location.coordinates[0], me.location.coordinates[1]]
      : [lng, lat];

    const features = users
      .filter((u) => u.location?.coordinates?.length === 2)
      .map((u) => {
        const coords = u.location!.coordinates as [number, number];
        const { score, reasons } = compatibility(me, u);
        const isFlat = u.lookingType === "has_flat";
        const props: MapFeatureProps & { reasons: string[]; priceLabel: string; occupation: string } = {
          id: String(u._id),
          name: (u.name ?? "").split(" ")[0],
          age: u.age ?? 0,
          photo: u.photos?.[0]?.url ?? "",
          score,
          kind: isFlat ? "flat" : "person",
          rentLabel: isFlat && u.flat?.rent ? formatRupeesShort(u.flat.rent) : undefined,
          locality: (isFlat ? u.flat?.locality : undefined) ?? u.locationLocality ?? u.localities?.[0] ?? undefined,
          distanceLabel: roundedDistanceLabel(distanceKm(origin, coords)),
          reasons,
          priceLabel: isFlat && u.flat?.rent ? `${formatRupeesShort(u.flat.rent)}/mo rent` : formatBudget(u.budgetMin ?? undefined, u.budgetMax ?? undefined),
          occupation: u.occupation === "student" ? "Student" : "Working professional",
        };
        return { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: coords }, properties: props };
      });

    return NextResponse.json(
      { type: "FeatureCollection", features },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[map/nearby]", e);
    return NextResponse.json({ error: "Couldn't load the map" }, { status: 500 });
  }
}
