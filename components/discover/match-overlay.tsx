"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChatBlobIcon as MessageCircle } from "@/components/icons";
import { Avatar } from "@/components/ui/photo";
import { Button } from "@/components/ui/button";
import type { Me } from "@/components/shell/realtime-provider";

export type MatchCelebration = { matchId: string; other: { name: string; photo: string } };

/** Full-screen "It's a match!" celebration. */
export function MatchOverlay({ me, match, onClose }: { me: Me; match: MatchCelebration | null; onClose: () => void }) {
  const router = useRouter();
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden px-6 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: "radial-gradient(120% 80% at 50% 10%, var(--sun) 0%, var(--peach) 28%, var(--brand) 62%, var(--lilac) 100%)",
            paddingTop: "var(--safe-top)",
            paddingBottom: "calc(var(--safe-bottom) + 1.5rem)",
          }}
        >
          {/* radar rings */}
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-[38%] size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 animate-radar"
              style={{ animationDelay: `${i * 1}s` }}
            />
          ))}
          <Confetti />

          <motion.h2
            id="match-title"
            className="relative text-center font-[family-name:var(--font-display)] text-6xl font-extrabold tracking-tight text-white [text-shadow:0_0_40px_rgba(255,255,255,.55)]"
            initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
          >
            It&apos;s a match!
          </motion.h2>
          <p className="relative mt-3 text-center text-white/85">
            You and {match.other.name} both want to live together. Say hi and talk rent!
          </p>

          <div className="relative mt-10 flex items-center">
            <motion.div initial={{ x: -80, rotate: -20, opacity: 0 }} animate={{ x: 12, rotate: -8, opacity: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Avatar src={me.photo} name={me.name} size={132} className="border-2 border-white/70 shadow-[var(--pop-shadow-sm)]" />
            </motion.div>
            <motion.div initial={{ x: 80, rotate: 20, opacity: 0 }} animate={{ x: -12, rotate: 8, opacity: 1 }} transition={{ type: "spring", delay: 0.25 }}>
              <Avatar src={match.other.photo} name={match.other.name} size={132} className="border-2 border-white/70 shadow-[var(--pop-shadow-sm)]" />
            </motion.div>
            <motion.span
              className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/25 text-3xl shadow-[0_0_40px_rgba(255,255,255,.6)] backdrop-blur-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.45, stiffness: 400 }}
              aria-hidden
            >
              🍒
            </motion.span>
          </div>

          <div className="relative mt-auto w-full max-w-sm space-y-3 pt-10">
            <Button
              size="lg"
              block
              className="border-2 border-white/70 bg-white text-pastel-ink shadow-[var(--pop-shadow-sm)] [background-image:none] active:scale-95 "
              onClick={() => {
                const id = match.matchId;
                onClose();
                router.push(`/chat/${id}`);
              }}
            >
              <MessageCircle className="size-5" /> Send a message
            </Button>
            <Button size="lg" block variant="ghost" className="font-extrabold text-white hover:bg-white/15" onClick={onClose}>
              Keep swiping
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 26 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          className={`absolute top-0 block ${i % 3 ? "h-3 w-2 rounded-sm" : "size-3 rounded-full"}`}
          style={{ left: `${(i * 37) % 100}%`, background: ["#fff", "var(--sun)", "var(--mint)", "var(--lilac)", "var(--sky)"][i % 5] }}
          initial={{ y: -40, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", rotate: 360 * (i % 2 ? 1 : -1), opacity: 0.9 }}
          transition={{ duration: 2.4 + (i % 5) * 0.4, delay: (i % 7) * 0.12, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
