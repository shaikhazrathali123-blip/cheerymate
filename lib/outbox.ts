"use client";
import type { ChatMessage } from "@/types";

/** Offline queue: messages typed while offline survive reloads and are sent when back online. */
const key = (matchId: string) => `cm-outbox-${matchId}`;

export function readOutbox(matchId: string): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(key(matchId)) ?? "[]");
  } catch {
    return [];
  }
}
export function writeOutbox(matchId: string, msgs: ChatMessage[]) {
  try {
    if (msgs.length) localStorage.setItem(key(matchId), JSON.stringify(msgs));
    else localStorage.removeItem(key(matchId));
  } catch {}
}
export function addToOutbox(m: ChatMessage) {
  writeOutbox(m.matchId, [...readOutbox(m.matchId).filter((x) => x.clientId !== m.clientId), m]);
}
export function removeFromOutbox(matchId: string, clientId: string) {
  writeOutbox(matchId, readOutbox(matchId).filter((x) => x.clientId !== clientId));
}

/** POST one message. Returns the saved message, `null` for network errors (retry later), or throws for hard errors. */
export async function postMessage(m: ChatMessage): Promise<ChatMessage | null> {
  let res: Response;
  try {
    res = await fetch(`/api/matches/${m.matchId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: m.text, imageUrl: m.imageUrl, clientId: m.clientId }),
    });
  } catch {
    return null; // offline / flaky network
  }
  if (res.status >= 500) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Couldn't send");
  return data.message as ChatMessage;
}
