import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { getMatchForUser, PAGE_SIZE, toChatMessage } from "@/lib/chat";
import { Message, User, type MessageDoc, type UserDoc } from "@/models";
import { ChatRoom } from "@/components/chat/chat-room";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ChatRoomPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const me = await requirePageUser();
  const access = await getMatchForUser(matchId, String(me._id));
  if (!access) notFound();

  const [other, docs] = await Promise.all([
    User.findById(access.otherId, { name: 1, photos: 1, isVerified: 1 }).lean<UserDoc>(),
    Message.find({ matchId }).sort({ createdAt: -1 }).limit(PAGE_SIZE + 1).lean<MessageDoc[]>(),
  ]);
  if (!other) notFound();

  return (
    <ChatRoom
      key={matchId}
      matchId={matchId}
      meId={String(me._id)}
      other={{ id: String(other._id), name: (other.name ?? "").split(" ")[0], photo: other.photos?.[0]?.url ?? "", isVerified: !!other.isVerified }}
      initialMessages={docs.slice(0, PAGE_SIZE).reverse().map(toChatMessage)}
      initialHasMore={docs.length > PAGE_SIZE}
    />
  );
}
