import { z } from "zod";
import { CITY_IDS, DEALBREAKERS, LIFESTYLE, LIMITS, REPORT_REASONS } from "./constants";

/* Only accept images from hosts we control or trust. */
const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const isAllowedImageUrl = (url: string) => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "res.cloudinary.com") return !cloud || u.pathname.startsWith(`/${cloud}/`);
    return u.hostname === "lh3.googleusercontent.com" || u.hostname === "randomuser.me";
  } catch {
    return false;
  }
};

export const photoSchema = z.object({
  url: z.string().url().refine(isAllowedImageUrl, "Unsupported image host"),
  publicId: z.string().max(200).optional(),
});

const lifestyleShape = Object.fromEntries(
  LIFESTYLE.map((q) => {
    const values = q.options.map((o) => o.value) as [string, ...string[]];
    const base = z.enum(values, { required_error: `Pick an option for "${q.label}"`, invalid_type_error: `Pick an option for "${q.label}"` });
    return [q.key, q.optional ? base.optional() : base];
  }),
) as Record<string, z.ZodTypeAny>;

/* Empty form inputs ("" / NaN) become undefined instead of coercing to 0. */
const emptyToUndef = (v: unknown) =>
  v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v;
const optInt = (min: number, max: number) =>
  z.preprocess(emptyToUndef, z.coerce.number().int().min(min).max(max).optional());

/* ------------------------------ Steps ------------------------------ */
export const basicsSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(40),
  age: z.coerce.number({ invalid_type_error: "Enter your age" }).int().min(18, "You must be 18 or older").max(80),
  gender: z.enum(["female", "male", "non_binary"], { required_error: "Select your gender" }),
  photos: z.array(photoSchema).min(1, "Add at least one photo").max(LIMITS.maxPhotos),
  occupation: z.enum(["student", "professional"], { required_error: "Select one" }),
  organisation: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(LIMITS.bioMax, `Max ${LIMITS.bioMax} characters`).optional().or(z.literal("")),
  languages: z.array(z.string().max(30)).min(1, "Pick at least one language").max(8),
});

export const housingSchema = z
  .object({
    lookingType: z.enum(["has_flat", "needs_flat"], { required_error: "Choose one" }),
    city: z.enum(CITY_IDS, { required_error: "Choose your city" }),
    localities: z.array(z.string().max(60)).min(1, "Pick at least one locality").max(8),
    budgetMin: z.coerce.number().int().min(1000).max(500000),
    budgetMax: z.coerce.number().int().min(1000).max(500000),
    moveInDate: z.coerce.date({ invalid_type_error: "Pick a date" }),
    roomType: z.enum(["private", "shared"], { required_error: "Choose a room type" }),
    flat: z
      .object({
        rent: optInt(1000, 500000),
        deposit: optInt(0, 2000000),
        furnishing: z.preprocess(emptyToUndef, z.enum(["unfurnished", "semi", "fully"]).optional()),
        locality: z.preprocess(emptyToUndef, z.string().max(60).optional()),
        photos: z.array(photoSchema).max(LIMITS.maxFlatPhotos).optional(),
      })
      .optional(),
  })
  .refine((d) => d.budgetMax >= d.budgetMin, { path: ["budgetMax"], message: "Max must be ≥ min" })
  .refine((d) => d.lookingType !== "has_flat" || (d.flat?.rent && d.flat.furnishing && d.flat.locality), {
    path: ["flat"],
    message: "Add rent, furnishing and locality for your flat",
  });

export const lifestyleSchema = z.object({ lifestyle: z.object(lifestyleShape) });

export const preferencesSchema = z
  .object({
    preferences: z.object({
      roommateGender: z.enum(["same", "any"]),
      ageMin: z.coerce.number().int().min(18).max(80),
      ageMax: z.coerce.number().int().min(18).max(80),
      dealbreakers: z.array(z.enum(DEALBREAKERS.map((d) => d.value) as [string, ...string[]])).max(DEALBREAKERS.length),
    }),
  })
  .refine((d) => d.preferences.ageMax >= d.preferences.ageMin, {
    path: ["preferences", "ageMax"],
    message: "Max age must be ≥ min age",
  });

export const mapStepSchema = z.object({
  showOnMap: z.boolean(),
  mapVisibleToWomenOnly: z.boolean().optional(),
});

export const STEP_SCHEMAS = [basicsSchema, housingSchema, lifestyleSchema, preferencesSchema, mapStepSchema] as const;

export type BasicsInput = z.infer<typeof basicsSchema>;
export type HousingInput = z.infer<typeof housingSchema>;
export type LifestyleInput = z.infer<typeof lifestyleSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;

/* ------------------------------ Others ----------------------------- */
export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const swipeSchema = z.object({
  toUserId: objectId,
  direction: z.enum(["like", "pass"]),
  source: z.enum(["discover", "map"]).default("discover"),
});

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.5).max(25).default(5),
  layer: z.enum(["people", "flats", "both"]).default("both"),
  budgetMin: optInt(0, 10_000_000),
  budgetMax: optInt(0, 10_000_000),
  locality: z.preprocess(emptyToUndef, z.string().max(60).optional()),
  moveInBefore: z.preprocess(emptyToUndef, z.string().max(30).optional()),
  lookingType: z.preprocess(emptyToUndef, z.enum(["has_flat", "needs_flat", "any"]).optional()),
});

export const discoverQuerySchema = nearbyQuerySchema.pick({
  budgetMin: true,
  budgetMax: true,
  locality: true,
  moveInBefore: true,
  lookingType: true,
});

export const sendMessageSchema = z
  .object({
    text: z.string().trim().max(2000).default(""),
    imageUrl: z.string().url().refine(isAllowedImageUrl, "Unsupported image host").optional(),
    clientId: z.string().min(6).max(64),
  })
  .refine((d) => d.text.length > 0 || d.imageUrl, { message: "Message is empty" });

export const reportSchema = z.object({
  userId: objectId,
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]]),
  details: z.string().trim().max(1000).optional(),
  matchId: objectId.optional(),
  alsoBlock: z.boolean().default(true),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});
