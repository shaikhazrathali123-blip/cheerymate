"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { objectId, reportSchema } from "@/lib/validators";
import { matchChannel, trigger, userChannel } from "@/lib/pusher";
import { rateLimit } from "@/lib/rate-limit";
import { Block, Match, Report, pairKeyOf } from "@/models";
import type { ActionResult } from "@/types";

async function closeMatch(meId: string, otherId: string, reason: "unmatch" | "block") {
  const match = await Match.findOneAndUpdate(
    { pairKey: pairKeyOf(meId, otherId), isActive: true },
    { $set: { isActive: false, closedBy: meId, closedReason: reason } },
    { new: true },
  ).lean();
  if (match) {
    const id = String(match._id);
    await Promise.all([
      trigger(matchChannel(id), "match:closed", { reason }),
      trigger(userChannel(otherId), "match:closed", { matchId: id }),
    ]);
  }
}

/** Block hides both people from each other everywhere (Discover, Map, Matches, Chat) and closes the chat. */
export async function blockUser(userId: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const id = objectId.parse(userId);
    if (id === String(me._id)) return { ok: false, error: "You can't block yourself" };
    await Block.updateOne({ blocker: me._id, blocked: id }, { $setOnInsert: { blocker: me._id, blocked: id } }, { upsert: true });
    await closeMatch(String(me._id), id, "block");
    revalidatePath("/matches");
    revalidatePath("/chat");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function unmatch(matchId: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const id = objectId.parse(matchId);
    const match = await Match.findOne({ _id: id, users: me._id }).lean();
    if (!match) return { ok: false, error: "Match not found" };
    const other = String(match.users.find((u) => String(u) !== String(me._id)));
    await closeMatch(String(me._id), other, "unmatch"); // swipes stay, so you won't see each other again
    revalidatePath("/matches");
    revalidatePath("/chat");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reportUser(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const d = reportSchema.parse(input);
    const rl = await rateLimit(`report:${me._id}`, 20, 24 * 3600);
    if (!rl.ok) return { ok: false, error: "Too many reports today" };
    await Report.create({ reporter: me._id, reportedUser: d.userId, reason: d.reason, details: d.details, matchId: d.matchId });
    if (d.alsoBlock) await blockUser(d.userId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
