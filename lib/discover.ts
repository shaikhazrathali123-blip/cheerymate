import "server-only";
import { Types } from "mongoose";
import { User, type UserDoc } from "@/models";
import { buildCandidateQuery, CARD_PROJECTION, getExcludedIds, rankScore, toPublicCard } from "./matching";
import type { DiscoverFilters, PublicCard } from "@/types";

/** Ranked Discover deck: hard filters in Mongo, then compatibility scoring + complementary boost. */
export async function getDiscoverCards(
  me: UserDoc,
  filters: DiscoverFilters = {},
  extraExclude: string[] = [],
  limit = 20,
): Promise<PublicCard[]> {
  const excluded = await getExcludedIds(me._id);
  for (const id of extraExclude) if (Types.ObjectId.isValid(id)) excluded.push(new Types.ObjectId(id));

  const candidates = await User.find(buildCandidateQuery(me, excluded, { filters }), CARD_PROJECTION)
    .sort({ lastActive: -1 })
    .limit(300)
    .lean<UserDoc[]>();

  return candidates
    .map((u) => {
      const card = toPublicCard(u, me);
      return { card, rank: rankScore(me, u, card.score) };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((x) => x.card);
}

export function parseFilters(sp: URLSearchParams): DiscoverFilters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const lt = sp.get("lookingType");
  return {
    budgetMin: num("budgetMin"),
    budgetMax: num("budgetMax"),
    locality: sp.get("locality") || undefined,
    moveInBefore: sp.get("moveInBefore") || undefined,
    lookingType: lt === "has_flat" || lt === "needs_flat" ? lt : undefined,
  };
}
