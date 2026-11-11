import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MessageSchema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    imageUrl: String,
    // Client-generated id → retries from the offline queue are idempotent.
    clientId: { type: String },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MessageSchema.index({ matchId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: "string" } } });
MessageSchema.index({ matchId: 1, sender: 1, readAt: 1 });

export type MessageDoc = InferSchemaType<typeof MessageSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Message: Model<MessageDoc> =
  (mongoose.models.Message as Model<MessageDoc>) ?? mongoose.model<MessageDoc>("Message", MessageSchema);
