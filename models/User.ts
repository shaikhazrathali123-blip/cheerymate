import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PhotoSchema = new Schema({ url: { type: String, required: true }, publicId: String }, { _id: false });

/** One document per person. Created on first Google sign-in (app/api/auth/google/callback). */
const UserSchema = new Schema(
  {
    // From Google sign-in
    googleId: { type: String, unique: true, sparse: true },
    name: String,
    email: { type: String, unique: true, sparse: true },
    image: String,
    emailVerified: Date,

    // Basics
    age: Number,
    gender: { type: String, enum: ["female", "male", "non_binary"] },
    photos: { type: [PhotoSchema], default: undefined },
    occupation: { type: String, enum: ["student", "professional"] },
    organisation: String, // college or company
    bio: String,
    languages: { type: [String], default: undefined },

    // Housing
    lookingType: { type: String, enum: ["has_flat", "needs_flat"] },
    city: { type: String, index: true },
    localities: { type: [String], default: undefined },
    budgetMin: Number,
    budgetMax: Number,
    moveInDate: Date,
    roomType: { type: String, enum: ["private", "shared"] },
    flat: {
      rent: Number,
      deposit: Number,
      furnishing: { type: String, enum: ["unfurnished", "semi", "fully"] },
      locality: String, // never an exact address
      photos: { type: [PhotoSchema], default: undefined },
    },

    // Lifestyle answers (key → option value)
    lifestyle: {
      cleanliness: String,
      sleep: String,
      food: String,
      cooking: String,
      smoking: String,
      drinking: String,
      guests: String,
      pets: String,
      wfh: String,
      noise: String,
      social: String,
      religion: String,
    },

    // Preferences
    preferences: {
      roommateGender: { type: String, enum: ["same", "any"], default: "any" },
      ageMin: { type: Number, default: 18 },
      ageMax: { type: Number, default: 40 },
      dealbreakers: { type: [String], default: [] },
    },

    // State
    onboardingComplete: { type: Boolean, default: false, index: true },
    onboardingStep: { type: Number, default: 0 },
    isPaused: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },

    // Map — `location` is ALWAYS the fuzzed point (500 m grid + fixed per-user offset)
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    locationSource: { type: String, enum: ["gps", "manual"] },
    locationLocality: String,
    locationUpdatedAt: Date,
    locationJitter: { type: { dLat: Number, dLng: Number }, select: false },
    showOnMap: { type: Boolean, default: false },
    ghostMode: { type: Boolean, default: false },
    mapVisibleToWomenOnly: { type: Boolean, default: false },

    // Notifications
    notifyMatches: { type: Boolean, default: true },
    notifyMessages: { type: Boolean, default: true },
    pushAskedAt: Date,
  },
  { timestamps: true, collection: "users" },
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ city: 1, onboardingComplete: 1, isPaused: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>("User", UserSchema);
