"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Camera, Check } from "lucide-react";
import { Avatar } from "@/components/ui/photo";
import { EmptyState, VerifiedBadge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn, formatRelative } from "@/lib/utils";
import type { MatchListItem } from "@/types";

export function ConversationRow({ item, active }: { item: MatchListItem; active?: boolean }) {
  const last = item.lastMessage;
  return (
    <Link
      href={`/chat/${item.matchId}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[72px] items-center gap-3 rounded-3xl px-3 py-2.5 transition-colors active:bg-surface-2",
        active ? "bg-brand-soft" : "hover:bg-surface-2",
      )}
    >
      <Avatar src={item.other.photo} name={item.other.name} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("truncate text-[16px]", item.unread ? "font-extrabold" : "font-semibold")}>{item.other.name}</p>
          <VerifiedBadge verified={item.other.isVerified} className="size-4" />
          <span className="ml-auto shrink-0 text-xs text-muted">{formatRelative(item.lastMessageAt ?? item.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className={cn("flex min-w-0 flex-1 items-center gap-1 truncate text-sm", item.unread ? "font-semibold text-ink" : "text-muted")}>
            {last?.mine && <Check className="size-3.5 shrink-0" aria-label="You:" />}
            {last?.hasImage && !last.text.replace("📷 Photo", "") && <Camera className="size-3.5 shrink-0" />}
            <span className="truncate">{last ? last.text : "You matched! Say hi 👋"}</span>
          </p>
          {item.unread > 0 && (
            <span className="grid min-w-[22px] place-items-center rounded-full bg-brand px-1.5 text-xs font-extrabold leading-[22px] text-white shadow-[0_0_12px_var(--brand-glow)]" aria-label={`${item.unread} unread`}>
              {item.unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ChatList({ items }: { items: MatchListItem[] }) {
  const params = useParams<{ matchId?: string }>();
  if (!items.length)
    return (
      <EmptyState
        emoji="💬"
        title="No chats yet"
        body="When you match with someone, you can talk rent and routines here."
        action={
          <Button asChild>
            <Link href="/discover">Start discovering</Link>
          </Button>
        }
      />
    );
  return (
    <ul className="space-y-1 px-2">
      {items.map((m) => (
        <li key={m.matchId}>
          <ConversationRow item={m} active={params?.matchId === m.matchId} />
        </li>
      ))}
    </ul>
  );
}
