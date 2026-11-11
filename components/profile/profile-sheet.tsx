"use client";
import { HeartIcon as Heart, NopeIcon as X } from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProfileDetails } from "./profile-details";
import type { PublicCard } from "@/types";

export function ProfileSheet({
  card,
  open,
  onOpenChange,
  onLike,
  onPass,
}: {
  card: PublicCard | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLike?: () => void;
  onPass?: () => void;
}) {
  if (!card) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${card.name}'s profile`}
      hideTitle
      full
      footer={
        onLike || onPass ? (
          <div className="flex gap-3">
            {onPass && (
              <Button variant="secondary" size="lg" className="flex-1" onClick={onPass}>
                <X className="size-5" /> Pass
              </Button>
            )}
            {onLike && (
              <Button size="lg" className="flex-1" onClick={onLike}>
                <Heart solid className="size-5" /> Like
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      <ProfileDetails card={card} />
    </Sheet>
  );
}
