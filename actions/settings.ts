"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { destroyFolder } from "@/lib/cloudinary";
import { matchChannel, trigger, userChannel } from "@/lib/pusher";
import { Block, Match, Message, PushSubscription, Report, Swipe, User } from "@/models";
import type { ActionResult } from "@/types";

const prefsSchema = z.object({ notifyMatches: z.boolean().optional(), notifyMessages: z.boolean().optional() });

export async function setNotificationPrefs(input: z.infer<typeof prefsSchema>): Promise<ActionResult> {
  try {
    const me = await requireUser();
    await User.updateOne({ _id: me._id }, { $set: prefsSchema.parse(input) });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signOutAction() {
  await signOut("/");
}

/** Permanently removes the user and ALL their data: profile, photos, swipes, matches, messages, location, subscriptions. */
export async function deleteAccount(confirm: string): Promise<ActionResult> {
  try {
    if (confirm !== "DELETE") return { ok: false, error: 'Type "DELETE" to confirm' };
    const me = await requireUser();
    const id = me._id;

    const matches = await Match.find({ users: id }, { _id: 1, users: 1 }).lean();
    const matchIds = matches.map((m) => m._id);

    // Tell the other side their chats closed
    await Promise.all(
      matches.flatMap((m) => {
        const other = String(m.users.find((u) => String(u) !== String(id)));
        return [trigger(matchChannel(String(m._id)), "match:closed", { reason: "deleted" }), trigger(userChannel(other), "match:closed", {})];
      }),
    );

    await Promise.all([
      Message.deleteMany({ matchId: { $in: matchIds } }),
      Match.deleteMany({ _id: { $in: matchIds } }),
      Swipe.deleteMany({ $or: [{ fromUser: id }, { toUser: id }] }),
      Block.deleteMany({ $or: [{ blocker: id }, { blocked: id }] }),
      Report.deleteMany({ reporter: id }),
      PushSubscription.deleteMany({ user: id }),
      destroyFolder(`cherrymate/users/${id}/`),
      ...matchIds.map((m) => destroyFolder(`cherrymate/chats/${m}/`)),
    ]);

    await User.deleteOne({ _id: id });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await signOut("/?deleted=1");
  return { ok: true };
}
