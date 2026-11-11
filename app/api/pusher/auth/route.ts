import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { getPusher } from "@/lib/pusher";
import { getMatchForUser } from "@/lib/chat";

/** Only authorises private-user-{me} and private-match-{id} for active, unblocked members of that match. */
export async function POST(req: Request) {
  const me = await getUserId();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const pusher = getPusher();
  if (!pusher) return new NextResponse("Realtime not configured", { status: 503 });

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!/^\d+\.\d+$/.test(socketId)) return new NextResponse("Bad socket", { status: 400 });

  if (channel === `private-user-${me}`) {
    return NextResponse.json(pusher.authorizeChannel(socketId, channel));
  }
  const m = channel.match(/^private-match-([a-f0-9]{24})$/i);
  if (m) {
    await connectDB();
    if (await getMatchForUser(m[1], me)) return NextResponse.json(pusher.authorizeChannel(socketId, channel));
  }
  return new NextResponse("Forbidden", { status: 403 });
}
