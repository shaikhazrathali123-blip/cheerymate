"use client";
import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { SwitchRow } from "@/components/ui/switch";
import { Sheet } from "@/components/ui/sheet";
import { Card } from "@/components/ui/misc";
import { ProfileDetails } from "./profile-details";
import { setPaused } from "@/actions/profile";
import type { PublicCard } from "@/types";

export function PauseToggle({ initial }: { initial: boolean }) {
  const [paused, setP] = useState(initial);
  return (
    <Card className="py-1">
      <SwitchRow
        title="Pause my profile"
        description={paused ? "You're hidden from Discover and the Map." : "Hide from Discover and the Map without deleting anything."}
        checked={paused}
        label="Pause my profile"
        onCheckedChange={async (v) => {
          setP(v);
          const r = await setPaused(v);
          if (!r.ok) {
            setP(!v);
            toast.error(r.error);
          } else toast(v ? "Profile paused" : "You're visible again");
        }}
      />
    </Card>
  );
}

export function PreviewCardButton({ card }: { card: PublicCard }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="mt-1 inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-brand">
        <Eye className="size-4" /> Preview how others see me
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Your card" description="This is what others see. Compatibility is calculated for each viewer." full>
        <ProfileDetails card={card} showScore={false} />
      </Sheet>
    </>
  );
}
