import type { UserDoc } from "@/models";

/** Serialisable defaults for the profile forms (onboarding + edit). Owner-only data. */
export function toFormDefaults(u: UserDoc) {
  const toPhotos = (arr?: { url: string; publicId?: string | null }[] | null) =>
    (arr ?? []).map((p) => ({ url: p.url, publicId: p.publicId ?? undefined }));
  const photos = toPhotos(u.photos);
  // Pre-fill with the Google avatar so a user can finish onboarding even before adding photos
  if (!photos.length && u.image) photos.push({ url: u.image, publicId: undefined });

  return {
    basics: {
      name: u.name ?? "",
      age: u.age ?? ("" as unknown as number),
      gender: u.gender ?? undefined,
      photos,
      occupation: u.occupation ?? undefined,
      organisation: u.organisation ?? "",
      bio: u.bio ?? "",
      languages: u.languages ?? ["English"],
    },
    housing: {
      lookingType: u.lookingType ?? undefined,
      city: u.city ?? undefined,
      localities: u.localities ?? [],
      budgetMin: u.budgetMin ?? 8000,
      budgetMax: u.budgetMax ?? 18000,
      moveInDate: (u.moveInDate ? new Date(u.moveInDate) : new Date(Date.now() + 14 * 864e5)).toISOString().slice(0, 10),
      roomType: u.roomType ?? "private",
      flat: {
        rent: u.flat?.rent ?? undefined,
        deposit: u.flat?.deposit ?? undefined,
        furnishing: u.flat?.furnishing ?? undefined,
        locality: u.flat?.locality ?? undefined,
        photos: toPhotos(u.flat?.photos),
      },
    },
    lifestyle: { lifestyle: Object.fromEntries(Object.entries(u.lifestyle ?? {}).filter(([, v]) => !!v)) as Record<string, string> },
    preferences: {
      preferences: {
        roommateGender: (u.preferences?.roommateGender ?? "any") as "same" | "any",
        ageMin: u.preferences?.ageMin ?? 18,
        ageMax: u.preferences?.ageMax ?? 35,
        dealbreakers: u.preferences?.dealbreakers ?? [],
      },
    },
    map: {
      showOnMap: !!u.showOnMap,
      mapVisibleToWomenOnly: !!u.mapVisibleToWomenOnly,
      hasLocation: !!u.location?.coordinates?.length,
      locationLocality: u.locationLocality ?? null,
    },
    gender: u.gender ?? null,
    city: u.city ?? null,
  };
}

export type FormDefaults = ReturnType<typeof toFormDefaults>;
