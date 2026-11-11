import "server-only";
import { Types } from "mongoose";
import { Match, Message, User, type UserDoc } from "@/models";
import type { MatchListItem } from "@/types";

/** Every active match of a user, with the other person, last message and unread count. Blocks close matches, so they never appear. */
export async function getMatchList(meId: Types.ObjectId | string): Promise<MatchListItem[]> {
  const matches = await Match.find({ users: meId, isActive: true })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .limit(200)
    .lean();
  if (!matches.length) return [];

  const otherIds = matches.map((m) => m.users.find((u) => String(u) !== String(meId))!);
  const [others, unread] = await Promise.all([
    User.find({ _id: { $in: otherIds } }, { name: 1, photos: 1, age: 1, isVerified: 1 }).lean<UserDoc[]>(),
    Message.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { matchId: { $in: matches.map((m) => m._id) }, sender: { $ne: toId(meId) }, readAt: null } },
      { $group: { _id: "$matchId", n: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(others.map((u) => [String(u._id), u]));
  const unreadBy = new Map(unread.map((u) => [String(u._id), u.n]));

  return matches.flatMap((m, i) => {
    const o = byId.get(String(otherIds[i]));
    if (!o) return [];
    return [
      {
        matchId: String(m._id),
        other: {
          id: String(o._id),
          name: (o.name ?? "").split(" ")[0],
          photo: o.photos?.[0]?.url ?? "",
          age: o.age ?? undefined,
          isVerified: !!o.isVerified,
        },
        createdAt: new Date(m.createdAt).toISOString(),
        lastMessageAt: m.lastMessageAt ? new Date(m.lastMessageAt).toISOString() : undefined,
        lastMessage: m.lastMessage?.sender
          ? {
              text: m.lastMessage.text ?? "",
              mine: String(m.lastMessage.sender) === String(meId),
              hasImage: !!m.lastMessage.hasImage,
            }
          : undefined,
        unread: unreadBy.get(String(m._id)) ?? 0,
      },
    ];
  });
}

export async function getUnreadTotal(meId: Types.ObjectId | string) {
  const matches = await Match.find({ users: meId, isActive: true }, { _id: 1 }).lean();
  if (!matches.length) return 0;
  return Message.countDocuments({ matchId: { $in: matches.map((m) => m._id) }, sender: { $ne: toId(meId) }, readAt: null });
}

function toId(id: Types.ObjectId | string) {
  // Message.sender is an ObjectId; aggregate $match does not cast strings.
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}
