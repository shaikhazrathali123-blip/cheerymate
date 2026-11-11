import "server-only";
import Pusher from "pusher";

const g = globalThis as unknown as { _pusher?: Pusher | null };

export function getPusher(): Pusher | null {
  if (g._pusher !== undefined) return g._pusher;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  g._pusher =
    PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER
      ? new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER, useTLS: true })
      : null;
  if (!g._pusher) console.warn("[pusher] not configured — realtime events are disabled");
  return g._pusher;
}

export const matchChannel = (matchId: string) => `private-match-${matchId}`;
export const userChannel = (userId: string) => `private-user-${userId}`;

/** Fire-and-forget trigger that never breaks the request. */
export async function trigger(channel: string | string[], event: string, data: unknown) {
  const p = getPusher();
  if (!p) return;
  try {
    await p.trigger(channel, event, data);
  } catch (e) {
    console.error("[pusher] trigger failed", e);
  }
}
