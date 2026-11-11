"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";
import { haptic } from "@/lib/utils";
import { MatchOverlay, type MatchCelebration } from "@/components/discover/match-overlay";
import { PushSoftAsk } from "@/components/push/push-soft-ask";

export type Me = { id: string; name: string; photo: string; gender?: string };

type Ctx = {
  me: Me;
  unread: number;
  refreshUnread: () => void;
  celebrate: (m: MatchCelebration) => void;
};

const RealtimeContext = createContext<Ctx | null>(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside <RealtimeProvider>");
  return ctx;
}

export function RealtimeProvider({ me, initialUnread, children }: { me: Me; initialUnread: number; children: React.ReactNode }) {
  const [unread, setUnread] = useState(initialUnread);
  const [celebration, setCelebration] = useState<MatchCelebration | null>(null);
  const [softAsk, setSoftAsk] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const refreshUnread = useCallback(() => {
    fetch("/api/unread", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUnread(d.total))
      .catch(() => {});
  }, []);

  const celebrate = useCallback((m: MatchCelebration) => {
    haptic([30, 60, 30]);
    setCelebration(m);
  }, []);

  // Per-user channel: new matches + unread counts update live
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const ch = pusher.subscribe(`private-user-${me.id}`);
    ch.bind("match:new", (d: { matchId: string; other: { name: string; photo: string } }) => {
      celebrate({ matchId: d.matchId, other: d.other });
      router.refresh();
    });
    ch.bind("message:new", (d: { matchId: string; senderName: string; preview: string }) => {
      refreshUnread();
      if (/^\/(chat|matches)/.test(pathRef.current)) router.refresh(); // keep lists fresh
      if (pathRef.current !== `/chat/${d.matchId}`) {
        toast(d.senderName, {
          description: d.preview,
          action: { label: "Open", onClick: () => router.push(`/chat/${d.matchId}`) },
        });
      }
    });
    ch.bind("unread:refresh", refreshUnread);
    ch.bind("match:closed", () => {
      refreshUnread();
      router.refresh();
    });
    return () => {
      ch.unbind_all();
      pusher.unsubscribe(`private-user-${me.id}`);
    };
  }, [me.id, celebrate, refreshUnread, router]);

  // Refresh when returning to the app
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && refreshUnread();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshUnread]);

  const closeCelebration = useCallback(() => {
    setCelebration(null);
    // Ask for notifications only after a meaningful moment (first match), never on first load
    try {
      if ("Notification" in window && Notification.permission === "default" && !localStorage.getItem("cm-push-asked")) {
        setTimeout(() => setSoftAsk(true), 400);
      }
    } catch {}
  }, []);

  const value = useMemo(() => ({ me, unread, refreshUnread, celebrate }), [me, unread, refreshUnread, celebrate]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <MatchOverlay me={me} match={celebration} onClose={closeCelebration} />
      <PushSoftAsk open={softAsk} onOpenChange={setSoftAsk} />
    </RealtimeContext.Provider>
  );
}
