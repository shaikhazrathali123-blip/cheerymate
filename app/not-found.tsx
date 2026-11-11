import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <main className="grid min-h-screen-d place-items-center page-glow">
      <EmptyState
        emoji="🔎"
        title="Nothing here"
        body="This page moved out — or the chat was closed."
        action={
          <Button asChild>
            <Link href="/discover">Back to Discover</Link>
          </Button>
        }
      />
    </main>
  );
}
