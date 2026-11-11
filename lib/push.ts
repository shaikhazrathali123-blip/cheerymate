import "server-only";
import webpush from "web-push";
import { PushSubscription } from "@/models";

let configured: boolean | null = null;
function configure() {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@cherrymate.app";
  configured = !!(pub && priv);
  if (configured) webpush.setVapidDetails(subject, pub!, priv!);
  return configured;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string; // where tapping the notification should go
  tag?: string; // collapses repeated notifications
  matchId?: string; // SW skips the notification if this chat is open & focused
  icon?: string;
};

/** Sends to every device of a user; prunes subscriptions that are gone (404/410). */
export async function sendPush(userId: string, payload: PushPayload) {
  if (!configure()) return;
  const subs = await PushSubscription.find({ user: userId }).lean();
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.keys!.p256dh, auth: s.keys!.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "high" },
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await PushSubscription.deleteOne({ endpoint: s.endpoint });
        else console.error("[push] send failed", status);
      }
    }),
  );
}
