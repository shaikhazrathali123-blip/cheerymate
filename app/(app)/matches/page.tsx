import Link from "next/link";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { getMatchList } from "@/lib/queries";
import { AppHeader } from "@/components/shell/app-header";
import { PullToRefresh } from "@/components/shell/pull-to-refresh";
import { ConversationRow } from "@/components/chat/chat-list";
import { Avatar } from "@/components/ui/photo";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionTitle } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Matches" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = await requirePageUser();
  const all = await getMatchList(me._id);
  const fresh = all.filter((m) => !m.lastMessage).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const convos = all.filter((m) => m.lastMessage);

  return (
    <div className="pb-nav lg:mx-auto lg:max-w-2xl lg:pb-8">
      <AppHeader title="Matches" subtitle="People who want to live with you too." avatar={{ src: me.photos?.[0]?.url ?? me.image, name: me.name }} />
      <PullToRefresh>
        {all.length === 0 ? (
          <EmptyState
            emoji="💞"
            title="No matches yet"
            body="Like people on Discover or the Map. When they like you back, they'll show up here."
            action={
              <Button asChild>
                <Link href="/discover">Find roommates</Link>
              </Button>
            }
          />
        ) : (
          <>
            {fresh.length > 0 && (
              <section className="mb-6">
                <SectionTitle className="px-5">New matches</SectionTitle>
                <ul className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
                  {fresh.map((m) => (
                    <li key={m.matchId} className="shrink-0">
                      <Link href={`/chat/${m.matchId}`} className="flex w-[76px] flex-col items-center gap-1.5">
                        <span className="rounded-full border border-[var(--pop-border)] bg-gradient-to-br from-sun via-brand to-lilac p-[3px] shadow-[var(--pop-shadow-sm)]">
                          <Avatar src={m.other.photo} name={m.other.name} size={70} className="ring-2 ring-[var(--bg)]" />
                        </span>
                        <span className="w-full truncate text-center text-sm font-semibold">{m.other.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <SectionTitle className="px-5">Conversations</SectionTitle>
              {convos.length ? (
                <ul className="space-y-1 px-2">
                  {convos.map((m) => (
                    <li key={m.matchId}>
                      <ConversationRow item={m} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 text-[15px] text-muted">Say hi to a new match to start a conversation 👋</p>
              )}
            </section>
          </>
        )}
      </PullToRefresh>
    </div>
  );
}
