"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GhostIcon, HeartIcon, HouseIcon, LocateIcon, NopeIcon, PinBlobIcon, ShieldIcon, SignalIcon, SlidersIcon } from "@/components/icons";
import { StatusPill } from "@/components/shell/status-pill";
import { Avatar } from "@/components/ui/photo";
import { toast } from "sonner";
import type { MapCanvasHandle } from "./map-canvas";
import type { Layer, NearbyFeature } from "./types";
import { getGPS } from "./location-controls";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Photo } from "@/components/ui/photo";
import { ScoreBadge, Skeleton } from "@/components/ui/misc";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { FiltersSheet, activeFilterCount, filtersToParams, loadFilters, saveFilters } from "@/components/filters/filters-sheet";
import { useRealtime } from "@/components/shell/realtime-provider";
import { setMapSettings, updateLocation } from "@/actions/location";
import { swipe } from "@/actions/swipe";
import { RADIUS_OPTIONS } from "@/lib/constants";
import { cn, haptic } from "@/lib/utils";
import type { DiscoverFilters, PublicCard } from "@/types";

// MapLibre (~200 kB) is only downloaded on /map
const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
});

type Props = {
  cityId: string;
  cityCenter: [number, number];
  myPoint: [number, number] | null;
  myPhoto: string;
  showOnMap: boolean;
  ghostMode: boolean;
  locationSource: string | null;
};

export function MapScreen({ cityId, cityCenter, myPoint, myPhoto, showOnMap, ghostMode: initialGhost, locationSource }: Props) {
  const { celebrate } = useRealtime();
  const canvas = useRef<MapCanvasHandle>(null);
  const [layer, setLayer] = useState<Layer>("both");
  const [radius, setRadius] = useState(5);
  const [center, setCenter] = useState<[number, number]>(myPoint ?? cityCenter);
  const [mePoint, setMePoint] = useState(myPoint);
  const [features, setFeatures] = useState<NearbyFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NearbyFeature | null>(null);
  const [fullCard, setFullCard] = useState<PublicCard | null>(null);
  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ghost, setGhost] = useState(initialGhost);
  const [note, setNote] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abort = useRef<AbortController | null>(null);

  const fetchNearby = useCallback(async (c: [number, number], r: number, l: Layer, f: DiscoverFilters) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    try {
      const p = filtersToParams(f);
      p.set("lng", c[0].toFixed(4));
      p.set("lat", c[1].toFixed(4));
      p.set("radius", String(r));
      p.set("layer", l);
      const res = await fetch(`/api/map/nearby?${p}`, { signal: ctrl.signal, cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeatures(data.features);
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message || "Couldn't load the map");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  // initial load + saved filters + first-open privacy note
  useEffect(() => {
    const f = loadFilters();
    setFilters(f);
    fetchNearby(center, radius, layer, f);
    try {
      if (!localStorage.getItem("cm-map-note")) {
        setNote(true);
        localStorage.setItem("cm-map-note", "1");
      }
    } catch {}
    // Refresh GPS location at most every 6h (server enforces), only if already permitted — never prompt here.
    if (showOnMap && locationSource === "gps" && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then(async (s) => {
        if (s.state !== "granted") return;
        const p = await getGPS().catch(() => null);
        if (!p) return;
        const r = await updateLocation(p.lat, p.lng);
        if (r.ok && r.data && !r.data.skipped) setMePoint([r.data.lng, r.data.lat]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = (c = center, r = radius, l = layer, f = filters) => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchNearby(c, r, l, f), 450); // debounce map moves
  };

  const onMoveEnd = (c: [number, number]) => {
    setCenter(c);
    refetch(c);
  };

  const locate = async () => {
    try {
      const p = await getGPS();
      const r = await updateLocation(p.lat, p.lng); // fuzzed + 6h limit server-side
      const point: [number, number] = r.ok && r.data ? [r.data.lng, r.data.lat] : [p.lng, p.lat];
      if (r.ok && r.data) setMePoint(point);
      canvas.current?.flyTo(point[0], point[1], 13.5);
    } catch (e) {
      toast.error((e as Error).message);
      canvas.current?.flyTo(cityCenter[0], cityCenter[1], 12); // denied → city centre, map still works
    }
  };

  const toggleGhost = async () => {
    const next = !ghost;
    setGhost(next);
    const r = await setMapSettings({ ghostMode: next });
    if (!r.ok) {
      setGhost(!next);
      return toast.error(r.error);
    }
    toast(next ? "Ghost mode on — you're hidden from the map" : "You're visible on the map again");
  };

  const act = async (dir: "like" | "pass") => {
    if (!selected) return;
    const id = selected.properties.id;
    setSelected(null);
    setFullCard(null);
    setFeatures((fs) => fs.filter((f) => f.properties.id !== id)); // optimistic
    if (dir === "like") haptic(15);
    const r = await swipe({ toUserId: id, direction: dir, source: "map" });
    if (!r.ok) return toast.error(r.error);
    if (r.data?.matched && r.data.matchId && r.data.other) celebrate({ matchId: r.data.matchId, other: r.data.other });
  };

  const openFull = async () => {
    if (!selected) return;
    const res = await fetch(`/api/profile/${selected.properties.id}`);
    if (!res.ok) return toast.error("Profile unavailable");
    const { card } = await res.json();
    setFullCard({ ...card, distanceLabel: selected.properties.distanceLabel });
  };

  const visibleNow = showOnMap && !ghost && !!mePoint;
  const p = selected?.properties;
  const fcount = activeFilterCount(filters);

  return (
    <div className="relative h-screen-d overflow-hidden">
      <MapCanvas
        ref={canvas}
        initialCenter={myPoint ?? cityCenter}
        initialZoom={myPoint ? 13 : 11.5}
        features={features}
        radiusKm={radius}
        center={center}
        me={{ photo: myPhoto, point: visibleNow ? mePoint : null }}
        onMoveEnd={onMoveEnd}
        onSelect={setSelected}
      />

      {/* Top overlay — header, visibility pill, layer toggle (reference design) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/75 to-transparent pb-12">
        <div className="pt-safe pointer-events-auto flex items-start justify-between px-5 pt-2">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight">Nearby</h1>
            <p className="text-sm text-muted">Meet nearby. Stay in control.</p>
          </div>
          <Link href="/profile" aria-label="Your profile" className="mt-1 rounded-full">
            <Avatar src={myPhoto} size={48} ring />
          </Link>
        </div>

        <div className="pointer-events-auto mt-3 flex flex-col items-center gap-2.5 px-5">
          <StatusPill
            icon={visibleNow ? <SignalIcon className="text-brand animate-pulse" /> : <GhostIcon active />}
            action={
              showOnMap && mePoint
                ? { label: ghost ? "Show me" : "Ghost", onClick: toggleGhost, pressed: ghost }
                : { label: "Edit", href: "/settings#map" }
            }
          >
            {!showOnMap ? "You're hidden from the map" : !mePoint ? "No location set" : ghost ? "Ghost mode on 👻" : "Visible nearby · approx."}
          </StatusPill>

          <div className="flex items-center gap-2">
            <div className="glass flex rounded-full p-1 shadow-soft" role="radiogroup" aria-label="Map layer">
              {(["people", "flats", "both"] as Layer[]).map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={layer === l}
                  onClick={() => (setLayer(l), refetch(center, radius, l))}
                  className={cn("min-h-[38px] rounded-full px-4 text-sm font-bold capitalize transition-colors", layer === l ? "chip-active shadow-[var(--pop-shadow-sm)]" : "text-ink-2")}
                >
                  {l}
                </button>
              ))}
            </div>
            <Button variant="glass" size="icon" onClick={() => setFiltersOpen(true)} aria-label={`Filters${fcount ? `, ${fcount} active` : ""}`} className="relative">
              <SlidersIcon active={fcount > 0} className="size-5" />
              {fcount > 0 && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-brand shadow-[0_0_10px_var(--brand-glow)]" />}
            </Button>
          </div>
        </div>
      </div>

      {note && (
        <div className="glass absolute inset-x-5 top-[calc(var(--safe-top)+11rem)] z-10 mx-auto flex max-w-sm items-start gap-2 rounded-2xl p-3 text-sm shadow-card animate-pop">
          <ShieldIcon className="mt-0.5 size-[18px] shrink-0 text-brand" />
          <p className="flex-1">Locations are approximate to protect everyone.</p>
          <button onClick={() => setNote(false)} aria-label="Dismiss" className="-m-1 p-1 text-muted">
            <NopeIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Bottom overlay — Distance chips + locate (thumb zone) */}
      <div className="absolute inset-x-0 z-10 px-4 lg:bottom-6" style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 1.25rem)" }}>
        {!loading && features.length === 0 && (
          <div className="glass mx-auto mb-3 max-w-sm rounded-2xl p-3 text-center text-sm shadow-card">
            No one nearby yet — try a bigger radius or check{" "}
            <Link href="/discover" className="font-semibold text-brand">
              Discover
            </Link>
            .
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="mb-2 pl-1 font-[family-name:var(--font-display)] text-[15px] font-bold">Distance</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {RADIUS_OPTIONS.map((r) => (
                <Chip key={r.km} size="sm" active={radius === r.km} onClick={() => (setRadius(r.km), refetch(center, r.km))} className="shrink-0 backdrop-blur-xl" aria-label={`${r.label}, ${r.km} km`}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
          <Button variant="dark" size="icon" onClick={locate} aria-label="Locate me" className="size-12 shrink-0 shadow-[0_0_24px_var(--brand-glow)]">
            <LocateIcon className="size-[22px]" />
          </Button>
        </div>
      </div>

      {/* Pin card */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={p ? `${p.name}, ${p.age}` : "Profile"} hideTitle>
        {p && (
          <div className="pb-2 pt-1">
            <div className="flex gap-4">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                <Photo src={p.photo} alt={p.name} fill sizes="96px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">
                    {p.name}, {p.age}
                  </h2>
                  {p.kind === "flat" && <HouseIcon active className="size-5 text-brand" aria-label="Has a flat" />}
                </div>
                <p className="text-sm text-muted">{p.occupation}</p>
                <div className="mt-2">
                  <ScoreBadge score={p.score} />
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-ink-2">
                  <PinBlobIcon className="size-4" /> {p.locality ?? "Nearby"} · {p.distanceLabel} away
                </p>
                <p className="text-sm font-semibold">{p.priceLabel}</p>
              </div>
            </div>
            {p.reasons.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.reasons.map((r) => (
                  <span key={r} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                    {r}
                  </span>
                ))}
              </div>
            )}
            <button onClick={openFull} className="mt-4 min-h-[44px] w-full rounded-2xl text-sm font-semibold text-brand">
              View full profile
            </button>
            <div className="mt-2 flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => act("pass")}>
                <NopeIcon className="size-5" /> Pass
              </Button>
              <Button size="lg" className="flex-1" onClick={() => act("like")}>
                <HeartIcon solid className="size-5" /> Like
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <ProfileSheet card={fullCard} open={!!fullCard} onOpenChange={(o) => !o && setFullCard(null)} onPass={() => act("pass")} onLike={() => act("like")} />
      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        cityId={cityId}
        value={filters}
        onApply={(f) => (setFilters(f), saveFilters(f), refetch(center, radius, layer, f))}
      />
    </div>
  );
}
