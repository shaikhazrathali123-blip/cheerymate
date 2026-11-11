import { requirePageUser } from "@/lib/session";
import { getMatchList } from "@/lib/queries";
import { AppHeader } from "@/components/shell/app-header";
import { ChatShell } from "@/components/chat/chat-shell";
import { ChatList } from "@/components/chat/chat-list";
import { PullToRefresh } from "@/components/shell/pull-to-refresh";

export const dynamic = "force-dynamic";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePageUser();
  const items = await getMatchList(me._id);

  return (
    <ChatShell
      list={
        <div className="pb-nav lg:pb-6">
          <AppHeader title="Chats" subtitle="Talk rent, routines and house rules." />
          <PullToRefresh>
            <ChatList items={items} />
          </PullToRefresh>
        </div>
      }
    >
      {children}
    </ChatShell>
  );
}
