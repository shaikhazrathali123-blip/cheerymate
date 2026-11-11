"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeartIcon as Heart, UndoIcon as RotateCcw, SlidersIcon as SlidersHorizontal, NopeIcon as X } from "@/components/icons";
import { toast } from "sonner";
import { SwipeCard, type SwipeCardHandle, type SwipeDir } from "./swipe-card";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { FiltersSheet, activeFilterCount, filtersToParams, loadFilters, saveFilters } from "@/components/filters/filters-sheet";
import { useRealtime } from "@/components/shell/realtime-provider";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { swipe, undoSwipe } from "@/actions/swipe";
import { haptic } from "@/lib/utils";
import type { DiscoverFilters, PublicCard } from "@/types";

export function SwipeDeck({ initialCards, cityId }: { initialCards: PublicCard[]; cityId: string }) {
  const { celebrate } = useRealtime();
  const [cards, setCards] = useState(initialCards);
  const [history, setHistory] = useState<{ card: PublicCard; dir: SwipeDir }[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const topRef = useRef<SwipeCardHandle>(null);
  const seen = useRef(new Set(initialCards.map((c) => c.id)));

  const fetchCards = useCallback(
    async (f: DiscoverFilters, replace: boolean, exclude: string[] = []) => {
      setLoading(true);
      try {
        const p = filtersToParams(f);
        if (exclude.length) p.set("exclude", exclude.slice(-60).join(","));
        const res = await fetch(`/api/discover?${p}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const fresh: PublicCard[] = data.cards;
        setExhausted(fresh.length === 0);
        setCards((cur) => {
          const base = replace ? [] : cur;
          const ids = new Set(base.map((c) => c.id));
          return [...base, ...fresh.filter((c) => !ids.has(c.id))];
        });
        fresh.forEach((c) => seen.current.add(c.id));
      } catch (e) {
        toast.error((e as Error).message || "Couldn't load profiles");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Restore saved filters on mount
  useEffect(() => {
    const f = loadFilters();
    if (activeFilterCount(f)) {
      setFilters(f);
      fetchCards(f, true);
    }
  }, [fetchCards]);

  // Top up the deck before it runs out
  useEffect(() => {
    if (cards.length <= 3 && !loading && !exhausted) fetchCards(filters, false, [...seen.current]);
  }, [cards.length, loading, exhausted, filters, fetchCards]);

  const commit = async (card: PublicCard, dir: SwipeDir) => {
    setCards((c) => c.filter((x) => x.id !== card.id)); // optimistic
    setHistory((h) => [...h.slice(-9), { card, dir }]);
    setSheetOpen(false);
    if (dir === "like") haptic(15);
    const res = await swipe({ toUserId: card.id, direction: dir, source: "discover" });
    if (!res.ok) {
      toast.error(res.error);
      setCards((c) => [card, ...c]);
      setHistory((h) => h.filter((x) => x.card.id !== card.id));
      return;
    }
    if (res.data?.matched && res.data.matchId && res.data.other) {
      celebrate({ matchId: res.data.matchId, other: res.data.other });
    }
  };

  const undo = async () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setCards((c) => [last.card, ...c]);
    const res = await undoSwipe(last.card.id);
    if (!res.ok) {
      toast.error(res.error);
      setCards((c) => c.filter((x) => x.id !== last.card.id));
    }
  };

  const applyFilters = (f: DiscoverFilters) => {
    setFilters(f);
    saveFilters(f);
    setExhausted(false);
    fetchCards(f, true);
  };

  const top = cards[0];
  const count = activeFilterCount(filters);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-3">
        <p className="text-sm font-medium text-muted">
          {top ? "Swipe right to like, left to pass" : " "}
        </p>
        <Button variant="glass" size="sm" onClick={() => setFiltersOpen(true)} aria-label={`Filters${count ? `, ${count} active` : ""}`}>
          <SlidersHorizontal className="size-4" /> Filters
          {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white shadow-[0_0_10px_var(--brand-glow)]">{count}</span>}
        </Button>
      </div>

      <div className="relative mx-auto w-full max-w-[440px] flex-1 px-4">
        <div className="relative size-full min-h-[380px]">
          {cards.length === 0 && loading && <Skeleton className="absolute inset-0 rounded-[var(--radius-card)]" />}
          {cards.length === 0 && !loading && (
            <div className="absolute inset-0 grid place-items-center">
              <EmptyState
                emoji="🏠"
                title="No more profiles nearby"
                body="Try widening your filters, or check the map for flats near you."
                action={
                  <div className="flex gap-2">
                    {count > 0 && (
                      <Button variant="secondary" onClick={() => applyFilters({})}>
                        Clear filters
                      </Button>
                    )}
                    <Button onClick={() => (setExhausted(false), fetchCards(filters, true))}>Refresh</Button>
                  </div>
                }
              />
            </div>
          )}
          {cards
            .slice(0, 4) // top card + next 3 are mounted → their images prefetch
            .map((card, i) => (
              <SwipeCard
                key={card.id}
                ref={i === 0 ? topRef : undefined}
                card={card}
                index={i}
                onSwiped={(dir) => commit(card, dir)}
                onOpen={() => setSheetOpen(true)}
              />
            ))
            .reverse()}
        </div>
      </div>

      {/* Thumb-zone actions */}
      <div className="flex items-center justify-center gap-5 py-4">
        <Button variant="secondary" size="icon-lg" aria-label="Pass" disabled={!top} onClick={() => topRef.current?.swipe("pass")}>
          <X className="size-7" strokeWidth={3} />
        </Button>
        <Button variant="glass" size="icon" aria-label="Undo last swipe" disabled={!history.length} onClick={undo}>
          <RotateCcw className="size-5" />
        </Button>
        <Button size="icon-lg" aria-label="Like" className="neon" disabled={!top} onClick={() => topRef.current?.swipe("like")}>
          <Heart solid className="size-8" />
        </Button>
      </div>

      <ProfileSheet
        card={top ?? null}
        open={sheetOpen && !!top}
        onOpenChange={setSheetOpen}
        onPass={() => (setSheetOpen(false), setTimeout(() => topRef.current?.swipe("pass"), 250))}
        onLike={() => (setSheetOpen(false), setTimeout(() => topRef.current?.swipe("like"), 250))}
      />
      <FiltersSheet open={filtersOpen} onOpenChange={setFiltersOpen} cityId={cityId} value={filters} onApply={applyFilters} />
    </div>
  );
}
