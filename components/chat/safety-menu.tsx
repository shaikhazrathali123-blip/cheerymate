"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Textarea } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { blockUser, reportUser, unmatch } from "@/actions/safety";
import { REPORT_REASONS } from "@/lib/constants";

type Mode = "menu" | "report" | "confirm-block" | "confirm-unmatch";

/** Unmatch / Block / Report — bottom sheet with confirmation steps. */
export function SafetyMenu({
  open,
  onOpenChange,
  userId,
  name,
  matchId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  name: string;
  matchId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [reason, setReason] = useState<string>();
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => setMode("menu"), 300);
  };

  const finish = (msg: string) => {
    toast.success(msg);
    close(false);
    onDone?.();
    router.push("/matches");
    router.refresh();
  };

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) return toast.error(r.error ?? "Something went wrong");
    finish(msg);
  };

  return (
    <Sheet open={open} onOpenChange={close} title={mode === "report" ? `Report ${name}` : `${name}`} description={mode === "report" ? "Reports are confidential. Our team reviews every one." : undefined}>
      {mode === "menu" && (
        <div className="space-y-2 pb-2">
          {matchId && (
            <MenuItem icon={<HeartOff className="size-5" />} title="Unmatch" body="Remove this match and close the chat." onClick={() => setMode("confirm-unmatch")} />
          )}
          <MenuItem icon={<Ban className="size-5" />} title="Block" body="You'll both disappear from each other everywhere." onClick={() => setMode("confirm-block")} danger />
          <MenuItem icon={<Flag className="size-5" />} title="Report" body="Fake profile, harassment, scams…" onClick={() => setMode("report")} danger />
        </div>
      )}

      {mode === "confirm-unmatch" && (
        <Confirm
          text={`Unmatch ${name}? Your chat will close and you won't see each other again.`}
          action="Unmatch"
          busy={busy}
          onCancel={() => setMode("menu")}
          onConfirm={() => run(() => unmatch(matchId!), "Unmatched")}
        />
      )}
      {mode === "confirm-block" && (
        <Confirm
          text={`Block ${name}? They won't be able to see or message you, and they won't be told.`}
          action="Block"
          busy={busy}
          onCancel={() => setMode("menu")}
          onConfirm={() => run(() => blockUser(userId), `${name} is blocked`)}
        />
      )}

      {mode === "report" && (
        <div className="space-y-5 pb-2">
          <Field label="What's wrong?">
            <ChipGroup size="sm" label="Report reason" options={REPORT_REASONS} value={reason} onChange={setReason} />
          </Field>
          <Field label="Anything else? (optional)" htmlFor="rep-details">
            <Textarea id="rep-details" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us what happened" />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Also block {name}</span>
            <Switch checked={alsoBlock} onCheckedChange={setAlsoBlock} label={`Also block ${name}`} />
          </div>
          <Button
            block
            size="lg"
            variant="danger"
            disabled={!reason}
            loading={busy}
            onClick={() => run(() => reportUser({ userId, reason, details: details || undefined, matchId, alsoBlock }), "Thanks — we'll review this report")}
          >
            Send report
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function MenuItem({ icon, title, body, onClick, danger }: { icon: React.ReactNode; title: string; body: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left active:bg-surface-2">
      <span className={`grid size-11 place-items-center rounded-full ${danger ? "bg-danger/10 text-danger" : "bg-surface-2 text-ink"}`}>{icon}</span>
      <span>
        <span className={`block font-semibold ${danger ? "text-danger" : ""}`}>{title}</span>
        <span className="block text-sm text-muted">{body}</span>
      </span>
    </button>
  );
}

function Confirm({ text, action, busy, onCancel, onConfirm }: { text: string; action: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="space-y-5 pb-2">
      <p className="text-[15px] text-ink-2">{text}</p>
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" className="flex-1" loading={busy} onClick={onConfirm}>
          {action}
        </Button>
      </div>
    </div>
  );
}
