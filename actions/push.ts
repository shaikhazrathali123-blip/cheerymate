"use server";
import { requireUser } from "@/lib/session";
import { pushSubscriptionSchema } from "@/lib/validators";
import { PushSubscription, User } from "@/models";
import type { ActionResult } from "@/types";

export async function savePushSubscription(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const sub = pushSubscriptionSchema.parse(input);
    await PushSubscription.updateOne(
      { endpoint: sub.endpoint },
      { $set: { user: me._id, keys: sub.keys } },
      { upsert: true },
    );
    await User.updateOne({ _id: me._id }, { $set: { pushAskedAt: new Date() } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    await PushSubscription.deleteOne({ endpoint: String(endpoint), user: me._id });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
