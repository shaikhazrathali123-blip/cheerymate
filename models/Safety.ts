import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/* ------------------------------- Report ------------------------------- */
const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: {
      type: String,
      enum: ["fake_profile", "harassment", "scam", "inappropriate_photos", "other"],
      required: true,
    },
    details: { type: String, maxlength: 1000 },
    matchId: Schema.Types.ObjectId,
    status: { type: String, enum: ["open", "reviewing", "actioned", "dismissed"], default: "open" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ReportDoc = InferSchemaType<typeof ReportSchema>;
export const Report: Model<ReportDoc> =
  (mongoose.models.Report as Model<ReportDoc>) ?? mongoose.model<ReportDoc>("Report", ReportSchema);

/* -------------------------------- Block ------------------------------- */
const BlockSchema = new Schema(
  {
    blocker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export type BlockDoc = InferSchemaType<typeof BlockSchema>;
export const Block: Model<BlockDoc> =
  (mongoose.models.Block as Model<BlockDoc>) ?? mongoose.model<BlockDoc>("Block", BlockSchema);

/* --------------------------- Push subscription ------------------------- */
const PushSubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type PushSubscriptionDoc = InferSchemaType<typeof PushSubscriptionSchema>;
export const PushSubscription: Model<PushSubscriptionDoc> =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDoc>) ??
  mongoose.model<PushSubscriptionDoc>("PushSubscription", PushSubscriptionSchema);

/* ----------------------------- Rate limiting --------------------------- */
// Fixed-window counters with a TTL index; works across serverless instances.
const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<{ key: string; count: number; expiresAt: Date }> =
  (mongoose.models.RateLimit as Model<{ key: string; count: number; expiresAt: Date }>) ??
  mongoose.model("RateLimit", RateLimitSchema);
