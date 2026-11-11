"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser } from "@/lib/session";
import {
  basicsSchema,
  housingSchema,
  lifestyleSchema,
  mapStepSchema,
  preferencesSchema,
} from "@/lib/validators";
import { destroyImages } from "@/lib/cloudinary";
import { User } from "@/models";
import type { ActionResult } from "@/types";

export type Section = "basics" | "housing" | "lifestyle" | "preferences" | "map";
const SECTION_INDEX: Record<Section, number> = { basics: 0, housing: 1, lifestyle: 2, preferences: 3, map: 4 };

const zodMessage = (e: unknown) =>
  e instanceof ZodError ? e.issues[0]?.message ?? "Invalid input" : (e as Error).message ?? "Something went wrong";

/** Builds the $set / $unset for one section after server-side validation. Never trusts client data. */
function buildUpdate(section: Section, raw: unknown, gender?: string | null) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};
  switch (section) {
    case "basics": {
      const d = basicsSchema.parse(raw);
      Object.assign($set, {
        name: d.name,
        age: d.age,
        gender: d.gender,
        photos: d.photos,
        occupation: d.occupation,
        organisation: d.organisation || undefined,
        bio: d.bio || "",
        languages: d.languages,
      });
      if (d.gender !== "female") $set.mapVisibleToWomenOnly = false;
      break;
    }
    case "housing": {
      const d = housingSchema.parse(raw);
      Object.assign($set, {
        lookingType: d.lookingType,
        city: d.city,
        localities: d.localities,
        budgetMin: d.budgetMin,
        budgetMax: d.budgetMax,
        moveInDate: d.moveInDate,
        roomType: d.roomType,
      });
      if (d.lookingType === "has_flat" && d.flat) {
        $set.flat = {
          rent: d.flat.rent,
          deposit: d.flat.deposit,
          furnishing: d.flat.furnishing,
          locality: d.flat.locality,
          photos: d.flat.photos ?? [],
        };
      } else $unset.flat = "";
      break;
    }
    case "lifestyle": {
      const d = lifestyleSchema.parse(raw);
      $set.lifestyle = d.lifestyle;
      break;
    }
    case "preferences": {
      const d = preferencesSchema.parse(raw);
      $set.preferences = d.preferences;
      break;
    }
    case "map": {
      const d = mapStepSchema.parse(raw);
      $set.showOnMap = d.showOnMap;
      $set.mapVisibleToWomenOnly = gender === "female" ? !!d.mapVisibleToWomenOnly : false;
      break;
    }
  }
  return { $set, $unset };
}

/** Onboarding: save one step; the final step marks onboarding complete. */
export async function saveOnboardingStep(section: Section, data: unknown, complete = false): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const { $set, $unset } = buildUpdate(section, data, section === "map" ? me.gender : undefined);
    $set.onboardingStep = Math.max(me.onboardingStep ?? 0, SECTION_INDEX[section] + 1);

    if (complete) {
      const merged = await User.findById(me._id).lean();
      const check = { ...merged, ...$set };
      // Re-validate every required section from what's actually stored
      basicsSchema.parse({ ...check, organisation: check.organisation ?? "", bio: check.bio ?? "" });
      housingSchema.parse({ ...check, flat: check.flat ?? undefined });
      lifestyleSchema.parse({ lifestyle: check.lifestyle });
      preferencesSchema.parse({ preferences: check.preferences });
      $set.onboardingComplete = true;
    }
    await User.updateOne({ _id: me._id }, { $set, ...(Object.keys($unset).length ? { $unset } : {}) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: zodMessage(e) };
  }
}

/** Profile edit: save one section. Deletes removed Cloudinary images. */
export async function updateProfileSection(section: Exclude<Section, "map">, data: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const { $set, $unset } = buildUpdate(section, data);
    await User.updateOne({ _id: me._id }, { $set, ...(Object.keys($unset).length ? { $unset } : {}) });

    // Clean up photos that were removed
    const before = [...(me.photos ?? []), ...(me.flat?.photos ?? [])].map((p) => p.publicId).filter(Boolean) as string[];
    const afterPhotos = [
      ...((($set.photos as { publicId?: string }[]) ?? me.photos) ?? []),
      ...((($set.flat as { photos?: { publicId?: string }[] })?.photos ?? (section === "housing" ? [] : me.flat?.photos)) ?? []),
    ];
    const after = new Set(afterPhotos.map((p) => p.publicId).filter(Boolean));
    const removed = before.filter((id) => !after.has(id) && id.startsWith(`cherrymate/users/${me._id}/`));
    if (removed.length) await destroyImages(removed);

    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: zodMessage(e) };
  }
}

export async function setPaused(paused: boolean): Promise<ActionResult> {
  try {
    const me = await requireUser();
    await User.updateOne({ _id: me._id }, { $set: { isPaused: !!paused } });
    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: zodMessage(e) };
  }
}
