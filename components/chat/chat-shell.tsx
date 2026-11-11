"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";

/** Mobile: list OR room. Desktop (≥1024px): two panes side by side. */
export function ChatShell({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const inRoom = !!segment;
  return (
    <div className="lg:grid lg:h-screen-d lg:grid-cols-[minmax(320px,380px)_1fr]">
      <section className={cn("lg:h-screen-d lg:overflow-y-auto lg:border-r lg:border-line", inRoom && "hidden lg:block")}>{list}</section>
      <section className={cn("min-w-0", !inRoom && "hidden lg:block")}>{children}</section>
    </div>
  );
}
