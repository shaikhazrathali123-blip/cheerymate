"use client";
import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Use for tall content such as full profiles */
  full?: boolean;
};

/** Bottom sheet (vaul) — used instead of centred modals everywhere. */
export function Sheet({ open, onOpenChange, title, description, hideTitle, children, footer, className, full }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col rounded-t-[var(--radius-sheet)] border-x border-t border-[var(--glass-border)] bg-bg-elevated outline-none",
            full ? "h-[92dvh]" : "max-h-[88dvh]",
            className,
          )}
          aria-describedby={description ? undefined : undefined}
        >
          <div className="mx-auto mt-3 h-2 w-14 shrink-0 rounded-full bg-lilac/70" aria-hidden />
          <div className={cn("px-5 pb-2 pt-3", hideTitle && "sr-only")}>
            <Drawer.Title className="text-lg font-bold text-ink">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="text-sm text-muted">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4" data-vaul-no-drag={full ? true : undefined}>
            {children}
          </div>
          {footer && (
            <div className="border-t border-line px-5 pt-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}>
              {footer}
            </div>
          )}
          {!footer && <div style={{ height: "var(--safe-bottom)" }} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
