import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MatchSchema = new Schema(
  {
    users: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true, index: true },
    // Sorted "idA_idB" — guarantees one match per pair even under concurrent likes.
    pairKey: { type: String, required: true, unique: true },
    lastMessageAt: Date,
    lastMessage: { text: String, sender: Schema.Types.ObjectId, hasImage: Boolean },
    isActive: { type: Boolean, default: true },
    closedBy: Schema.Types.ObjectId,
    closedReason: { type: String, enum: ["unmatch", "block"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MatchSchema.index({ users: 1, isActive: 1, lastMessageAt: -1 });

export const pairKeyOf = (a: string, b: string) => [a, b].sort().join("_");

export type MatchDoc = InferSchemaType<typeof MatchSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Match: Model<MatchDoc> =
  (mongoose.models.Match as Model<MatchDoc>) ?? mongoose.model<MatchDoc>("Match", MatchSchema);
