"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CheckCheck, Clock, Loader2 } from "lucide-react";
import { BackIcon as ChevronLeft, PhotoIcon as ImagePlus, DotsIcon as MoreVertical, SendIcon as SendHorizontal, ShieldIcon as ShieldAlert } from "@/components/icons";
import { toast } from "sonner";
import type { Channel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher-client";
import { addToOutbox, postMessage, readOutbox, removeFromOutbox } from "@/lib/outbox";
import { uploadImage } from "@/lib/upload-client";
import { SAFETY_BANNER } from "@/lib/constants";
import { cn, formatDay, formatTime, uid } from "@/lib/utils";
import { Avatar, Photo } from "@/components/ui/photo";
import { VerifiedBadge } from "@/components/ui/misc";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { SafetyMenu } from "./safety-menu";
import { useRealtime } from "@/components/shell/realtime-provider";
import type { ChatMessage, PublicCard } from "@/types";

type Props = {
  matchId: string;
  meId: string;
  other: { id: string; name: string; photo: string; isVerified: boolean };
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
};

/** Keeps the room exactly the visible height so the composer sits on top of the keyboard (iOS + Android). */
function useViewportHeight() {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => {
      setH(vv.height);
      window.scrollTo(0, 0);
    };
    on();
    vv.addEventListener("resize", on);
    return () => vv.removeEventListener("resize", on);
  }, []);
  return h;
}

export function ChatRoom({ matchId, meId, other, initialMessages, initialHasMore }: Props) {
  const { refreshUnread } = useRealtime();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  // Merge messages queued while offline (after mount, so SSR markup matches)
  useEffect(() => {
    const queued = readOutbox(matchId);
    if (!queued.length) return;
    const ids = new Set(initialMessages.map((m) => m.clientId));
    // Drop ones the server already has
    queued.filter((q) => ids.has(q.clientId)).forEach((q) => removeFromOutbox(matchId, q.clientId!));
    const pending = queued.filter((q) => !ids.has(q.clientId)).map((q) => ({ ...q, status: "queued" as const }));
    if (pending.length) setMessages((cur) => [...cur, ...pending]);
  }, [matchId, initialMessages]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [closed, setClosed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<PublicCard | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<Channel | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nearBottom = useRef(true);
  const flushing = useRef(false);
  const vh = useViewportHeight();

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => scrollToBottom(), [scrollToBottom]);

  const markRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    fetch(`/api/matches/${matchId}/read`, { method: "POST" })
      .then(() => refreshUnread())
      .catch(() => {});
  }, [matchId, refreshUnread]);

  /* ----------------------------- realtime ----------------------------- */
  useEffect(() => {
    markRead();
    const pusher = getPusherClient();
    if (!pusher) return;
    const ch = pusher.subscribe(`private-match-${matchId}`);
    channelRef.current = ch;
    ch.bind("message:new", (m: ChatMessage) => {
      setMessages((cur) => {
        if (cur.some((x) => x.id === m.id || (m.clientId && x.clientId === m.clientId && x.sender === m.sender)))
          return cur.map((x) => (m.clientId && x.clientId === m.clientId ? { ...m, status: "sent" } : x));
        return [...cur, { ...m, status: "sent" }];
      });
      if (m.sender !== meId) {
        setTyping(false);
        markRead();
      }
    });
    ch.bind("messages:read", (d: { by: string; at: string }) => {
      if (d.by === meId) return;
      setMessages((cur) => cur.map((x) => (x.sender === meId && !x.readAt ? { ...x, readAt: d.at } : x)));
    });
    ch.bind("client-typing", (d: { userId: string }) => {
      if (d.userId === meId) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3500);
    });
    ch.bind("match:closed", () => setClosed(true));
    const onVis = () => document.visibilityState === "visible" && markRead();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      ch.unbind_all();
      pusher.unsubscribe(`private-match-${matchId}`);
      channelRef.current = null;
    };
  }, [matchId, meId, markRead]);

  // Auto-scroll when new messages arrive and the user is near the bottom
  useEffect(() => {
    if (nearBottom.current) scrollToBottom(true);
  }, [messages.length, typing, scrollToBottom]);

  /* ---------------------------- offline queue ---------------------------- */
  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;
    flushing.current = true;
    try {
      for (const q of readOutbox(matchId)) {
        setMessages((cur) => cur.map((x) => (x.clientId === q.clientId ? { ...x, status: "sending" } : x)));
        try {
          const saved = await postMessage(q);
          if (!saved) {
            setMessages((cur) => cur.map((x) => (x.clientId === q.clientId ? { ...x, status: "queued" } : x)));
            break; // still offline — try again later
          }
          removeFromOutbox(matchId, q.clientId!);
          setMessages((cur) => cur.map((x) => (x.clientId === q.clientId ? { ...saved, status: "sent" } : x)));
        } catch (e) {
          removeFromOutbox(matchId, q.clientId!);
          setMessages((cur) => cur.map((x) => (x.clientId === q.clientId ? { ...x, status: "failed" } : x)));
          toast.error((e as Error).message);
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [matchId]);

  useEffect(() => {
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  const enqueue = (partial: Pick<ChatMessage, "text" | "imageUrl">) => {
    const m: ChatMessage = {
      id: `local-${uid()}`,
      clientId: uid(),
      matchId,
      sender: meId,
      text: partial.text,
      imageUrl: partial.imageUrl,
      createdAt: new Date().toISOString(),
      readAt: null,
      status: navigator.onLine ? "sending" : "queued",
    };
    addToOutbox(m);
    nearBottom.current = true;
    setMessages((cur) => [...cur, m]); // optimistic
    flush();
  };

  const send = () => {
    const t = text.trim();
    if (!t || closed) return;
    setText("");
    enqueue({ text: t });
    inputRef.current?.focus();
  };

  const onPickImage = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(f, "chat", matchId);
      enqueue({ text: "", imageUrl: url });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onType = (v: string) => {
    setText(v);
    const now = Date.now();
    if (channelRef.current && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      try {
        channelRef.current.trigger("client-typing", { userId: meId });
      } catch {}
    }
  };

  /* ---------------------------- older messages ---------------------------- */
  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    const oldest = messages.find((m) => !m.id.startsWith("local-"));
    if (!oldest) return;
    setLoadingOlder(true);
    const el = scrollRef.current!;
    const prevHeight = el.scrollHeight;
    try {
      const res = await fetch(`/api/matches/${matchId}/messages?before=${encodeURIComponent(oldest.createdAt)}`);
      const data = await res.json();
      if (res.ok) {
        setHasMore(data.hasMore);
        setMessages((cur) => [...data.messages, ...cur]);
        requestAnimationFrame(() => (el.scrollTop = el.scrollHeight - prevHeight)); // keep position
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMore, messages, matchId]);

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadOlder(), { root: scrollRef.current, rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadOlder]);

  const openProfile = async () => {
    setProfileOpen(true);
    if (!profile) {
      const res = await fetch(`/api/profile/${other.id}`);
      if (res.ok) setProfile((await res.json()).card);
    }
  };

  /* -------------------------------- render -------------------------------- */
  const lastMineRead = [...messages].reverse().find((m) => m.sender === meId && m.readAt)?.id;

  return (
    <div className="flex flex-col bg-bg lg:h-screen-d" style={{ height: vh ? `${vh}px` : "100dvh" }}>
      {/* Header */}
      <header className="pt-safe z-10 flex items-center gap-2 border-b border-line bg-bg/90 px-2 pb-2 backdrop-blur-xl">
        <Link href="/chat" className="tap grid place-items-center rounded-full lg:hidden" aria-label="Back to chats">
          <ChevronLeft className="size-6" />
        </Link>
        <button onClick={openProfile} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 text-left" aria-label={`View ${other.name}'s profile`}>
          <Avatar src={other.photo} name={other.name} size={42} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-bold">
              {other.name} <VerifiedBadge verified={other.isVerified} className="size-4" />
            </span>
            <span className="block text-xs text-muted">{typing ? "typing…" : "Tap to view profile"}</span>
          </span>
        </button>
        <button onClick={() => setMenuOpen(true)} className="tap grid place-items-center rounded-full" aria-label="Chat options: unmatch, block, report">
          <MoreVertical className="size-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${other.name}`}
      >
        <div ref={topRef} />
        {loadingOlder && <Loader2 className="mx-auto my-2 size-5 animate-spin text-muted" />}
        {!hasMore && (
          <div className="glass mx-auto mb-4 max-w-sm rounded-3xl p-4 text-center shadow-soft">
            <ShieldAlert active className="mx-auto mb-1.5 size-6 text-brand" />
            <p className="text-sm font-extrabold">🛡️ {SAFETY_BANNER}</p>
            <p className="mt-1 text-xs opacity-75">Never share bank details or OTPs. Report anything that feels off.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender === meId;
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const grouped = prev && prev.sender === m.sender && !newDay;
          return (
            <div key={m.clientId ?? m.id}>
              {newDay && <p className="my-3 text-center text-xs font-semibold text-muted">{formatDay(m.createdAt)}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2.5")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-3xl px-3.5 py-2 text-[15px] leading-snug shadow-sm",
                    mine ? "rounded-br-md border border-[var(--pop-border)] bg-[var(--bubble-me)] text-[var(--bubble-me-ink)] shadow-[var(--pop-shadow-sm)]" : "rounded-bl-md border-2 border-line bg-[var(--bubble-them)] text-[var(--bubble-them-ink)]",
                    m.imageUrl && "p-1.5",
                    m.status === "failed" && "opacity-60",
                  )}
                >
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer" className="relative block aspect-square w-56 overflow-hidden rounded-2xl">
                      <Photo src={m.imageUrl} alt="Shared photo" fill sizes="224px" />
                    </a>
                  )}
                  {m.text && <p className={cn("whitespace-pre-wrap break-words", m.imageUrl && "px-2 py-1")}>{m.text}</p>}
                  <span className={cn("mt-0.5 flex items-center justify-end gap-1 text-[11px]", mine ? "text-white/75" : "text-muted", m.imageUrl && "px-2")}>
                    {formatTime(m.createdAt)}
                    {mine && <StatusIcon m={m} />}
                  </span>
                </div>
              </div>
              {mine && m.id === lastMineRead && <p className="mt-0.5 pr-1 text-right text-[11px] text-muted">Seen</p>}
            </div>
          );
        })}

        {typing && (
          <div className="mt-2.5 flex">
            <div className="flex gap-1 rounded-3xl rounded-bl-lg bg-[var(--bubble-them)] px-4 py-3" aria-label={`${other.name} is typing`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer — pinned above the keyboard */}
      {closed ? (
        <p className="border-t border-line p-4 text-center text-sm text-muted" style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}>
          This chat has been closed.
        </p>
      ) : (
        <form
          onSubmit={(e) => (e.preventDefault(), send())}
          className="flex items-end gap-2 border-t border-line bg-bg/95 px-3 pt-2 backdrop-blur-xl"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 0.5rem)" }}
        >
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="tap grid place-items-center rounded-full text-muted" aria-label="Send a photo">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-6" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (onPickImage(e.target.files?.[0]), (e.target.value = ""))} />
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={2000}
            onChange={(e) => {
              onType(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 132)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message…"
            enterKeyHint="send"
            className="max-h-[132px] min-h-[44px] flex-1 resize-none rounded-3xl border-2 border-line bg-surface px-4 py-2.5 text-base leading-6 text-ink placeholder:text-muted focus:border-lilac focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="pop pop-press grid size-11 shrink-0 place-items-center rounded-full brand-gradient text-white disabled:opacity-40"
            aria-label="Send"
            onMouseDown={(e) => e.preventDefault()} // keep the keyboard open
          >
            <SendHorizontal className="size-5" />
          </button>
        </form>
      )}

      <SafetyMenu open={menuOpen} onOpenChange={setMenuOpen} userId={other.id} name={other.name} matchId={matchId} />
      <ProfileSheet card={profile} open={profileOpen && !!profile} onOpenChange={setProfileOpen} />
    </div>
  );
}

function StatusIcon({ m }: { m: ChatMessage }) {
  if (m.status === "queued" || m.status === "sending") return <Clock className="size-3" aria-label="Sending" />;
  if (m.status === "failed") return <span className="font-bold" aria-label="Failed">!</span>;
  if (m.readAt) return <CheckCheck className="size-3.5" aria-label="Read" />;
  return <Check className="size-3.5" aria-label="Delivered" />;
}
