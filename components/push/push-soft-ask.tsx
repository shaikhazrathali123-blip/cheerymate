"use client";
import { BellIcon as BellRing } from "@/components/icons";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePush } from "@/hooks/use-push";

/** Our own soft-ask screen, shown before the browser's permission prompt. */
export function PushSoftAsk({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, subscribe } = usePush();

  const later = () => {
    try {
      localStorage.setItem("cm-push-asked", "1");
    } catch {}
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : later())} title="Don't miss your matches" hideTitle>
      <div className="flex flex-col items-center pb-2 pt-4 text-center">
        <div className="mb-4 grid size-20 place-items-center rounded-full bg-brand-soft text-brand">
          <BellRing className="size-9" />
        </div>
        <h2 className="text-xl font-bold">Don&apos;t miss your next roommate</h2>
        <p className="mt-2 max-w-xs text-muted">
          Get a ping when someone matches with you or replies. No spam — you can turn it off any time in Settings.
        </p>
        {state === "ios-needs-install" && (
          <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm text-ink-2">
            On iPhone, notifications work once Cherrymate is added to your Home Screen (iOS 16.4+): tap Share → Add to
            Home Screen, then open it from there.
          </p>
        )}
        <div className="mt-6 w-full space-y-2">
          {state !== "ios-needs-install" && state !== "unsupported" && (
            <Button
              block
              size="lg"
              onClick={async () => {
                try {
                  const ok = await subscribe();
                  toast[ok ? "success" : "message"](ok ? "Notifications on" : "Notifications stay off");
                } catch (e) {
                  toast.error((e as Error).message);
                }
                onOpenChange(false);
              }}
            >
              Turn on notifications
            </Button>
          )}
          <Button block variant="ghost" onClick={later}>
            Not now
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
