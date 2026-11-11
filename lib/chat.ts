import "server-only";
import { Types } from "mongoose";
import { Match, type MessageDoc } from "@/models";
import { isBlockedPair } from "./matching";
import type { ChatMessage } from "@/types";

/** Returns the match only if `userId` belongs to it, it is active and nobody has blocked anyone. */
export async function getMatchForUser(matchId: string, userId: string) {
  if (!Types.ObjectId.isValid(matchId)) return null;
  const match = await Match.findOne({ _id: matchId, users: userId, isActive: true }).lean();
  if (!match) return null;
  const otherId = String(match.users.find((u) => String(u) !== userId));
  if (await isBlockedPair(userId, otherId)) return null;
  return { match, otherId };
}

export function toChatMessage(m: MessageDoc): ChatMessage {
  return {
    id: String(m._id),
    clientId: m.clientId ?? undefined,
    matchId: String(m.matchId),
    sender: String(m.sender),
    text: m.text ?? "",
    imageUrl: m.imageUrl ?? undefined,
    createdAt: new Date(m.createdAt).toISOString(),
    readAt: m.readAt ? new Date(m.readAt).toISOString() : null,
    status: "sent",
  };
}

export const PAGE_SIZE = 30;
