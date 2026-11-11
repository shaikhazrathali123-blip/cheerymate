"use server";
import { Types } from "mongoose";
import { requireUser } from "@/lib/session";
import { swipeSchema, objectId } from "@/lib/validators";
import { buildCandidateQuery, isBlockedPair } from "@/lib/matching";
import { rateLimit } from "@/lib/rate-limit";
import { trigger, userChannel } from "@/lib/pusher";
import { sendPush } from "@/lib/push";
import { LIMITS } from "@/lib/constants";
import { Match, Swipe, User, pairKeyOf } from "@/models";
import type { ActionResult } from "@/types";

type SwipeResult = { matched: boolean; matchId?: string; other?: { name: string; photo: string } };

/** Like / pass — same logic from Discover and the Map. Creates a Match when the like is mutual. */
export async function swipe(input: unknown): Promise<ActionResult<SwipeResult>> {
  try {
    const me = await requireUser();
    const { toUserId, direction, source } = swipeSchema.parse(input);
    if (toUserId === String(me._id)) return { ok: false, error: "That's you!" };

    // Never trust the client: the target must pass every hard filter for me (blocks included).
    if (await isBlockedPair(me._id, toUserId)) return { ok: false, error: "This profile isn't available" };
    const target = await User.findOne(
      { $and: [buildCandidateQuery(me, []), { _id: new Types.ObjectId(toUserId) }] },
      { name: 1, photos: 1, notifyMatches: 1 },
    ).lean();
    if (!target) return { ok: false, error: "This profile isn't available any more" };

    if (direction === "like") {
      const rl = await rateLimit(`likes:${me._id}`, LIMITS.likesPerDay, 24 * 3600);
      if (!rl.ok) return { ok: false, error: "You've hit today's like limit. Come back tomorrow!" };
    }

    await Swipe.updateOne(
      { fromUser: me._id, toUser: target._id },
      { $set: { direction, source }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    if (direction === "pass") return { ok: true, data: { matched: false } };

    const mutual = await Swipe.exists({ fromUser: target._id, toUser: me._id, direction: "like" });
    if (!mutual) return { ok: true, data: { matched: false } };

    const pairKey = pairKeyOf(String(me._id), String(target._id));
    const res = await Match.findOneAndUpdate(
      { pairKey },
      { $setOnInsert: { users: [me._id, target._id], pairKey, isActive: true } },
      { upsert: true, new: true, includeResultMetadata: true },
    );
    const match = res.value!;
    const created = !res.lastErrorObject?.updatedExisting;
    if (!match.isActive) return { ok: true, data: { matched: false } };

    const matchId = String(match._id);
    const myName = (me.name ?? "").split(" ")[0];
    const myPhoto = me.photos?.[0]?.url ?? "";
    if (created) {
      await Promise.all([
        trigger(userChannel(String(target._id)), "match:new", { matchId, other: { name: myName, photo: myPhoto } }),
        target.notifyMatches !== false
          ? sendPush(String(target._id), {
              title: "It's a match! 🍒",
              body: `You and ${myName} liked each other. Say hi!`,
              url: `/chat/${matchId}`,
              tag: `match-${matchId}`,
            })
          : Promise.resolve(),
      ]);
    }
    return {
      ok: true,
      data: { matched: true, matchId, other: { name: (target.name ?? "").split(" ")[0], photo: target.photos?.[0]?.url ?? "" } },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Undo the last swipe (only if it didn't create a match). */
export async function undoSwipe(toUserId: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const id = objectId.parse(toUserId);
    const matched = await Match.exists({ pairKey: pairKeyOf(String(me._id), id) });
    if (matched) return { ok: false, error: "You've already matched — check your Matches tab" };
    await Swipe.deleteOne({ fromUser: me._id, toUser: id });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
