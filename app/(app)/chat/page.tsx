import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Chats" };

/** Desktop right pane placeholder (on mobile the layout shows the list instead). */
export default function ChatIndex() {
  return (
    <div className="hidden h-screen-d place-items-center lg:grid">
      <EmptyState emoji="💬" title="Pick a conversation" body="Your matches and chats are on the left." />
    </div>
  );
}
