import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SwipeSchema = new Schema(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    direction: { type: String, enum: ["like", "pass"], required: true },
    source: { type: String, enum: ["discover", "map"], default: "discover" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SwipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
SwipeSchema.index({ fromUser: 1, direction: 1, createdAt: -1 });

export type SwipeDoc = InferSchemaType<typeof SwipeSchema> & { _id: mongoose.Types.ObjectId };
export const Swipe: Model<SwipeDoc> =
  (mongoose.models.Swipe as Model<SwipeDoc>) ?? mongoose.model<SwipeDoc>("Swipe", SwipeSchema);
