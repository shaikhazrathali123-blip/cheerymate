import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { getMatchForUser, PAGE_SIZE, toChatMessage } from "@/lib/chat";
import { sendMessageSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { matchChannel, trigger, userChannel } from "@/lib/pusher";
import { sendPush } from "@/lib/push";
import { LIMITS } from "@/lib/constants";
import { Match, Message, User, type MessageDoc } from "@/models";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ matchId: string }> };

/** Older messages for infinite scroll: ?before=<ISO date> */
export async function GET(req: Request, { params }: Ctx) {
  const { matchId } = await params;
  const me = await getUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  if (!(await getMatchForUser(matchId, me))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = new URL(req.url).searchParams.get("before");
  const q: Record<string, unknown> = { matchId };
  if (before && !isNaN(Date.parse(before))) q.createdAt = { $lt: new Date(before) };
  const docs = await Message.find(q).sort({ createdAt: -1 }).limit(PAGE_SIZE + 1).lean<MessageDoc[]>();
  const hasMore = docs.length > PAGE_SIZE;
  return NextResponse.json(
    { messages: docs.slice(0, PAGE_SIZE).reverse().map(toChatMessage), hasMore },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Send: validate → save → Pusher → push (if the other person isn't in this chat). Idempotent per clientId. */
export async function POST(req: Request, { params }: Ctx) {
  const { matchId } = await params;
  const me = await getUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const access = await getMatchForUser(matchId, me);
  if (!access) return NextResponse.json({ error: "This chat is closed" }, { status: 403 });

  const parsed = sendMessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const { text, imageUrl, clientId } = parsed.data;

  const existing = await Message.findOne({ sender: me, clientId }).lean<MessageDoc>();
  if (existing) return NextResponse.json({ message: toChatMessage(existing) });

  const rl = await rateLimit(`msg:${me}`, LIMITS.messagesPerMinute, 60);
  if (!rl.ok) return NextResponse.json({ error: "You're sending messages too fast" }, { status: 429 });

  let doc: MessageDoc;
  try {
    doc = (await Message.create({ matchId, sender: me, text, imageUrl, clientId })).toObject() as MessageDoc;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) {
      const dup = await Message.findOne({ sender: me, clientId }).lean<MessageDoc>();
      if (dup) return NextResponse.json({ message: toChatMessage(dup) });
    }
    throw e;
  }

  const message = toChatMessage(doc);
  const preview = text ? text.slice(0, 120) : "📷 Photo";
  const [sender, other] = await Promise.all([
    User.findById(me, { name: 1 }).lean(),
    User.findById(access.otherId, { notifyMessages: 1 }).lean(),
    Match.updateOne({ _id: matchId }, { $set: { lastMessageAt: doc.createdAt, lastMessage: { text: preview, sender: me, hasImage: !!imageUrl } } }),
  ]);
  const senderName = (sender?.name ?? "").split(" ")[0] || "New message";

  await Promise.all([
    trigger(matchChannel(matchId), "message:new", message),
    trigger(userChannel(access.otherId), "message:new", { matchId, senderName, preview }),
    other?.notifyMessages !== false
      ? sendPush(access.otherId, { title: senderName, body: preview, url: `/chat/${matchId}`, tag: `chat-${matchId}`, matchId })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ message });
}
