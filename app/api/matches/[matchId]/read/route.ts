import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { getMatchForUser } from "@/lib/chat";
import { matchChannel, trigger } from "@/lib/pusher";
import { Message } from "@/models";

type Ctx = { params: Promise<{ matchId: string }> };

/** Read receipts: marks the other person's messages as read and tells them. */
export async function POST(_req: Request, { params }: Ctx) {
  const { matchId } = await params;
  const me = await getUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const access = await getMatchForUser(matchId, me);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const at = new Date();
  const res = await Message.updateMany({ matchId, sender: access.otherId, readAt: null }, { $set: { readAt: at } });
  if (res.modifiedCount > 0) await trigger(matchChannel(matchId), "messages:read", { by: me, at: at.toISOString() });
  return NextResponse.json({ ok: true, updated: res.modifiedCount });
}
