import "server-only";
import type { FilterQuery, Types } from "mongoose";
import { Block, Match, Swipe, type UserDoc } from "@/models";
import { LIFESTYLE, lifestyleLabel, type DealbreakerValue } from "./constants";
import type { DiscoverFilters, Lifestyle, PublicCard } from "@/types";

/* =====================================================================
   1. HARD FILTERS (applied in MongoDB, on Discover AND Map)
   ===================================================================== */

/** Mongo condition a *candidate* must satisfy for each of MY dealbreakers. */
const DEALBREAKER_QUERY: Record<DealbreakerValue, FilterQuery<UserDoc>> = {
  no_smokers: { "lifestyle.smoking": "never" },
  no_drinkers: { "lifestyle.drinking": "never" },
  veg_only: { "lifestyle.food": { $in: ["veg", "vegan", "jain"] } },
  no_pets: { "lifestyle.pets": { $ne: "have_pets" } },
  no_parties: { "lifestyle.guests": { $ne: "often" } },
  no_night_owls: { "lifestyle.sleep": { $ne: "night_owl" } },
  tidy_only: { "lifestyle.cleanliness": { $in: ["spotless", "tidy"] } },
};

/** Which dealbreakers does a person with this lifestyle violate? (for the reverse check) */
export function violatedDealbreakers(l: Lifestyle = {}): DealbreakerValue[] {
  const v: DealbreakerValue[] = [];
  if (l.smoking && l.smoking !== "never") v.push("no_smokers");
  if (l.drinking && l.drinking !== "never") v.push("no_drinkers");
  if (l.food && !["veg", "vegan", "jain"].includes(l.food)) v.push("veg_only");
  if (l.pets === "have_pets") v.push("no_pets");
  if (l.guests === "often") v.push("no_parties");
  if (l.sleep === "night_owl") v.push("no_night_owls");
  if (l.cleanliness && !["spotless", "tidy"].includes(l.cleanliness)) v.push("tidy_only");
  return v;
}

/** Users I must never see: me, anyone I swiped, anyone I'm/was matched with, blocks both ways. */
export async function getExcludedIds(meId: Types.ObjectId | string): Promise<Types.ObjectId[]> {
  const [swipes, matches, blocks] = await Promise.all([
    Swipe.find({ fromUser: meId }, { toUser: 1 }).lean(),
    Match.find({ users: meId }, { users: 1 }).lean(),
    Block.find({ $or: [{ blocker: meId }, { blocked: meId }] }, { blocker: 1, blocked: 1 }).lean(),
  ]);
  const ids = new Map<string, Types.ObjectId>();
  const add = (id: Types.ObjectId) => ids.set(String(id), id);
  swipes.forEach((s) => add(s.toUser));
  matches.forEach((m) => m.users.forEach(add));
  blocks.forEach((b) => {
    add(b.blocker as Types.ObjectId);
    add(b.blocked as Types.ObjectId);
  });
  ids.delete(String(meId));
  return [...ids.values()];
}

/** Is there a block between these two users in either direction? */
export async function isBlockedPair(a: string | Types.ObjectId, b: string | Types.ObjectId) {
  return !!(await Block.exists({
    $or: [
      { blocker: a, blocked: b },
      { blocker: b, blocked: a },
    ],
  }));
}

export function buildCandidateQuery(
  me: UserDoc,
  excluded: Types.ObjectId[],
  opts: { forMap?: boolean; filters?: DiscoverFilters } = {},
): FilterQuery<UserDoc> {
  const and: FilterQuery<UserDoc>[] = [
    { _id: { $nin: [me._id, ...excluded] } },
    { city: me.city },
    { onboardingComplete: true },
    { isPaused: { $ne: true } },
  ];

  // Gender preference — both ways
  if (me.preferences?.roommateGender === "same") and.push({ gender: me.gender });
  and.push({ $or: [{ "preferences.roommateGender": { $ne: "same" } }, { gender: me.gender }] });

  // Age range — both ways
  const ageMin = me.preferences?.ageMin ?? 18;
  const ageMax = me.preferences?.ageMax ?? 99;
  and.push({ age: { $gte: ageMin, $lte: ageMax } });
  if (me.age) {
    and.push({ "preferences.ageMin": { $lte: me.age } });
    and.push({ "preferences.ageMax": { $gte: me.age } });
  }

  // Dealbreakers — both ways
  for (const d of (me.preferences?.dealbreakers ?? []) as DealbreakerValue[]) {
    if (DEALBREAKER_QUERY[d]) and.push(DEALBREAKER_QUERY[d]);
  }
  const iViolate = violatedDealbreakers(me.lifestyle as Lifestyle);
  if (iViolate.length) and.push({ "preferences.dealbreakers": { $nin: iViolate } });

  // Map-only visibility rules
  if (opts.forMap) {
    and.push({ showOnMap: true, ghostMode: { $ne: true }, "location.coordinates": { $exists: true } });
    if (me.gender !== "female") and.push({ mapVisibleToWomenOnly: { $ne: true } });
  }

  // User-chosen filters (Discover filters sheet + Map)
  const f = opts.filters;
  if (f) {
    if (f.lookingType && f.lookingType !== "any") and.push({ lookingType: f.lookingType });
    if (f.budgetMin != null || f.budgetMax != null) {
      const lo = f.budgetMin ?? 0;
      const hi = f.budgetMax ?? 10_000_000;
      and.push({
        $or: [
          { lookingType: "has_flat", "flat.rent": { $gte: lo, $lte: hi } },
          { lookingType: "needs_flat", budgetMin: { $lte: hi }, budgetMax: { $gte: lo } },
        ],
      });
    }
    if (f.locality) {
      and.push({ $or: [{ localities: f.locality }, { "flat.locality": f.locality }, { locationLocality: f.locality }] });
    }
    if (f.moveInBefore) {
      const d = new Date(f.moveInBefore);
      if (!isNaN(d.getTime())) and.push({ moveInDate: { $lte: d } });
    }
  }

  return { $and: and };
}

/* =====================================================================
   2. COMPATIBILITY SCORE (0–100) + "Top reasons you'd get along"
   ===================================================================== */

const FOOD_MATRIX: Record<string, Record<string, number>> = {
  veg: { veg: 1, jain: 0.8, vegan: 0.8, eggetarian: 0.6, non_veg: 0.2 },
  jain: { jain: 1, veg: 0.8, vegan: 0.7, eggetarian: 0.3, non_veg: 0 },
  vegan: { vegan: 1, veg: 0.8, jain: 0.7, eggetarian: 0.4, non_veg: 0.1 },
  eggetarian: { eggetarian: 1, veg: 0.6, non_veg: 0.6, vegan: 0.4, jain: 0.3 },
  non_veg: { non_veg: 1, eggetarian: 0.6, veg: 0.2, vegan: 0.1, jain: 0 },
};
const PETS_MATRIX: Record<string, Record<string, number>> = {
  have_pets: { have_pets: 1, love_pets: 1, no_pets: 0.3, allergic: 0 },
  love_pets: { have_pets: 1, love_pets: 1, no_pets: 0.6, allergic: 0.3 },
  no_pets: { have_pets: 0.3, love_pets: 0.6, no_pets: 1, allergic: 1 },
  allergic: { have_pets: 0, love_pets: 0.3, no_pets: 1, allergic: 1 },
};
const SLEEP_MATRIX: Record<string, Record<string, number>> = {
  early_bird: { early_bird: 1, flexible: 0.7, night_owl: 0 },
  flexible: { early_bird: 0.7, flexible: 1, night_owl: 0.7 },
  night_owl: { early_bird: 0, flexible: 0.7, night_owl: 1 },
};

function questionSimilarity(key: string, a?: string, b?: string): number | null {
  if (!a || !b) return null;
  if (key === "food") return FOOD_MATRIX[a]?.[b] ?? 0;
  if (key === "pets") return PETS_MATRIX[a]?.[b] ?? 0;
  if (key === "sleep") return SLEEP_MATRIX[a]?.[b] ?? 0;
  const q = LIFESTYLE.find((x) => x.key === key)!;
  const i = q.options.findIndex((o) => o.value === a);
  const j = q.options.findIndex((o) => o.value === b);
  if (i < 0 || j < 0) return null;
  return 1 - Math.abs(i - j) / (q.options.length - 1);
}

type Scorable = Pick<
  UserDoc,
  "lifestyle" | "budgetMin" | "budgetMax" | "lookingType" | "flat" | "localities" | "moveInDate" | "languages"
>;

const priceRange = (u: Scorable): [number, number] | null => {
  if (u.lookingType === "has_flat" && u.flat?.rent) return [u.flat.rent, u.flat.rent];
  if (u.budgetMin && u.budgetMax) return [u.budgetMin, u.budgetMax];
  return null;
};

function budgetOverlap(a: Scorable, b: Scorable): number {
  const ra = priceRange(a);
  const rb = priceRange(b);
  if (!ra || !rb) return 0.5;
  const lo = Math.max(ra[0], rb[0]);
  const hi = Math.min(ra[1], rb[1]);
  if (hi >= lo) {
    const minWidth = Math.min(ra[1] - ra[0], rb[1] - rb[0]);
    return minWidth === 0 ? 1 : Math.min(1, 0.6 + (0.4 * (hi - lo)) / minWidth);
  }
  const gap = lo - hi;
  const mid = (ra[0] + ra[1] + rb[0] + rb[1]) / 4;
  return Math.max(0, 0.5 - gap / (0.5 * mid));
}

const placesOf = (u: Scorable) => {
  const s = new Set(u.localities ?? []);
  if (u.lookingType === "has_flat" && u.flat?.locality) s.add(u.flat.locality);
  return s;
};

export function compatibility(me: Scorable, other: Scorable): { score: number; reasons: string[] } {
  const la = (me.lifestyle ?? {}) as Lifestyle;
  const lb = (other.lifestyle ?? {}) as Lifestyle;

  // Lifestyle — 70 pts (cleanliness, sleep, food, smoking weighted highest)
  let wSum = 0;
  let sSum = 0;
  for (const q of LIFESTYLE) {
    const sim = questionSimilarity(q.key, la[q.key as keyof Lifestyle], lb[q.key as keyof Lifestyle]);
    if (sim == null) continue;
    wSum += q.weight;
    sSum += q.weight * sim;
  }
  const lifestylePts = wSum ? (sSum / wSum) * 70 : 35;

  // Budget — 15 pts
  const budget = budgetOverlap(me, other);
  // Localities — 10 pts
  const mine = placesOf(me);
  const shared = [...placesOf(other)].filter((l) => mine.has(l));
  const localityPts = shared.length >= 2 ? 10 : shared.length === 1 ? 7 : 0;
  // Move-in within ~30 days — 5 pts
  let moveInPts = 0;
  let moveInClose = false;
  if (me.moveInDate && other.moveInDate) {
    const days = Math.abs(new Date(me.moveInDate).getTime() - new Date(other.moveInDate).getTime()) / 864e5;
    moveInClose = days <= 30;
    moveInPts = days <= 30 ? 5 : days <= 60 ? 2.5 : 0;
  }

  const score = Math.max(0, Math.min(100, Math.round(lifestylePts + budget * 15 + localityPts + moveInPts)));

  /* ------------------------------ reasons ------------------------------ */
  const reasons: string[] = [];
  const same = (k: keyof Lifestyle) => la[k] && la[k] === lb[k];
  if (me.lookingType !== other.lookingType) {
    reasons.push(
      other.lookingType === "has_flat"
        ? `Has a flat${other.flat?.locality ? ` in ${other.flat.locality}` : ""} you could move into`
        : "Needs a flat — you have one",
    );
  }
  if (same("sleep")) reasons.push({ night_owl: "Both night owls", early_bird: "Both early birds", flexible: "Both flexible sleepers" }[la.sleep!]!);
  if (same("food"))
    reasons.push(
      { veg: "Both vegetarian", vegan: "Both vegan", jain: "Both follow Jain food", eggetarian: "Both eggetarian", non_veg: "Both non-veg foodies" }[la.food!]!,
    );
  if (la.smoking === "never" && lb.smoking === "never") reasons.push("Both non-smokers");
  if (["spotless", "tidy"].includes(la.cleanliness ?? "") && ["spotless", "tidy"].includes(lb.cleanliness ?? ""))
    reasons.push("Both like a tidy home");
  if (budget >= 0.6) reasons.push("Budgets overlap");
  if (shared.length) reasons.push(`Both want ${shared[0]}`);
  if (moveInClose) reasons.push("Moving in around the same time");
  if (la.drinking === "never" && lb.drinking === "never") reasons.push("Neither of you drinks");
  if (la.noise === "quiet" && lb.noise === "quiet") reasons.push("Both like it quiet");
  if (same("social")) reasons.push(`Both ${lifestyleLabel("social", la.social)?.toLowerCase()}s`);
  if (["have_pets", "love_pets"].includes(la.pets ?? "") && ["have_pets", "love_pets"].includes(lb.pets ?? ""))
    reasons.push("Both pet lovers");
  if (la.wfh === "always" && lb.wfh === "always") reasons.push("Both work from home");
  const lang = (me.languages ?? []).find((l) => l !== "English" && (other.languages ?? []).includes(l));
  if (lang) reasons.push(`Both speak ${lang}`);

  return { score, reasons: reasons.slice(0, 3) };
}

/** Sorting key: compatibility + boost for complementary looking types (has flat ↔ needs flat). */
export const rankScore = (me: Scorable, other: Scorable, score: number) =>
  score + (me.lookingType && other.lookingType && me.lookingType !== other.lookingType ? 8 : 0);

/* =====================================================================
   3. PUBLIC CARD — the ONLY shape other users ever receive
   ===================================================================== */
export const CARD_PROJECTION = {
  name: 1, age: 1, gender: 1, photos: 1, occupation: 1, organisation: 1, bio: 1, languages: 1,
  lookingType: 1, city: 1, localities: 1, budgetMin: 1, budgetMax: 1, moveInDate: 1, roomType: 1,
  flat: 1, lifestyle: 1, isVerified: 1, preferences: 1, location: 1, locationLocality: 1, lastActive: 1,
} as const;

export function toPublicCard(u: UserDoc, me: Scorable | null, extra: Partial<PublicCard> = {}): PublicCard {
  const { score, reasons } = me ? compatibility(me, u) : { score: 0, reasons: [] };
  return {
    id: String(u._id),
    name: (u.name ?? "").split(" ")[0] || "Someone", // first name only
    age: u.age ?? 0,
    gender: u.gender ?? "",
    photos: (u.photos ?? []).map((p) => p.url),
    occupation: u.occupation ?? "",
    organisation: u.organisation ?? undefined,
    bio: u.bio ?? undefined,
    languages: u.languages ?? [],
    lookingType: (u.lookingType ?? "needs_flat") as PublicCard["lookingType"],
    city: u.city ?? "",
    localities: u.localities ?? [],
    budgetMin: u.budgetMin ?? undefined,
    budgetMax: u.budgetMax ?? undefined,
    moveInDate: u.moveInDate ? new Date(u.moveInDate).toISOString() : undefined,
    roomType: u.roomType ?? undefined,
    flat:
      u.lookingType === "has_flat" && u.flat
        ? {
            rent: u.flat.rent ?? undefined,
            deposit: u.flat.deposit ?? undefined,
            furnishing: u.flat.furnishing ?? undefined,
            locality: u.flat.locality ?? undefined,
            photos: (u.flat.photos ?? []).map((p) => p.url),
          }
        : undefined,
    lifestyle: (u.lifestyle ?? {}) as Lifestyle,
    isVerified: !!u.isVerified,
    score,
    reasons,
    ...extra,
  };
}
