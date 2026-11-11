"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef, type MapLayerMouseEvent, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import { HouseIcon as Home } from "@/components/icons";
import { useDark } from "@/hooks/use-dark";
import { brandMapStyle, mapStyleUrl } from "@/lib/map-style";
import { cldUrl, cn, scoreTone } from "@/lib/utils";
import type { NearbyFeature } from "./types";

export type MapCanvasHandle = { flyTo: (lng: number, lat: number, zoom?: number) => void };

type Props = {
  initialCenter: [number, number];
  initialZoom: number;
  features: NearbyFeature[];
  radiusKm: number;
  center: [number, number];
  me: { photo: string; point: [number, number] | null };
  onMoveEnd: (center: [number, number]) => void;
  onSelect: (f: NearbyFeature) => void;
};

const RING: Record<string, string> = {
  high: "var(--score-high)",
  mid: "var(--score-mid)",
  low: "var(--score-low)",
};

function circlePolygon([lng, lat]: [number, number], km: number, steps = 64) {
  const coords: [number, number][] = [];
  const dLat = km / 110.574;
  const dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

const MapCanvas = forwardRef<MapCanvasHandle, Props>(function MapCanvas(
  { initialCenter, initialZoom, features, radiusKm, center, me, onMoveEnd, onSelect },
  ref,
) {
  const dark = useDark();
  const mapRef = useRef<MapRef>(null);
  // MapLibre paint needs real colour values, so read them from the design tokens
  const t = useMemo(() => {
    const css = typeof window === "undefined" ? null : getComputedStyle(document.documentElement);
    const v = (name: string, fb: string) => css?.getPropertyValue(name).trim() || fb;
    return { brand: v("--brand", "#ff4f7b"), ink: v("--pastel-ink", "#2b1a3d"), text: v("--ink", "#2b1a3d"), bg: v("--bg", "#fff7ec"), sun: v("--sun", "#ffd45c") };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);
  const [visible, setVisible] = useState<NearbyFeature[]>([]);

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom) => mapRef.current?.flyTo({ center: [lng, lat], zoom: zoom ?? Math.max(mapRef.current.getZoom(), 13), duration: 900 }),
  }));

  const data = useMemo(() => ({ type: "FeatureCollection" as const, features }), [features]);
  const byId = useMemo(() => new globalThis.Map(features.map((f) => [f.properties.id, f])), [features]);

  // HTML avatar/house markers only for points that are NOT inside a cluster right now
  const syncMarkers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.getSource("nearby")) return;
    const rendered = map.querySourceFeatures("nearby", { filter: ["!", ["has", "point_count"]] });
    const seen = new Set<string>();
    const out: NearbyFeature[] = [];
    for (const r of rendered) {
      const id = r.properties?.id as string;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const f = byId.get(id);
      if (f) out.push(f);
    }
    setVisible(out);
  }, [byId]);

  const onClick = async (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f || f.layer.id !== "clusters") return;
    const map = mapRef.current!.getMap();
    const src = map.getSource("nearby") as GeoJSONSource;
    const zoom = await src.getClusterExpansionZoom(f.properties!.cluster_id as number);
    const [lng, lat] = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
    map.easeTo({ center: [lng, lat], zoom: zoom + 0.3, duration: 500 });
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: initialCenter[0], latitude: initialCenter[1], zoom: initialZoom }}
      mapStyle={mapStyleUrl(dark)}
      style={{ position: "absolute", inset: 0 }}
      attributionControl={{ compact: true }}
      dragRotate={false}
      touchPitch={false}
      maxZoom={15.5} // never zoom to street-level precision
      minZoom={9}
      interactiveLayerIds={["clusters"]}
      onLoad={(e) => {
        brandMapStyle(e.target);
        syncMarkers();
      }}
      onStyleData={(e) => brandMapStyle(e.target)}
      onMoveEnd={(e: ViewStateChangeEvent) => {
        syncMarkers();
        onMoveEnd([e.viewState.longitude, e.viewState.latitude]);
      }}
      onSourceData={(e) => {
        if (e.sourceId === "nearby" && e.isSourceLoaded) syncMarkers();
      }}
      onClick={onClick}
    >
      {/* search radius */}
      <Source id="radius" type="geojson" data={circlePolygon(center, radiusKm)}>
        <Layer id="radius-fill" type="fill" paint={{ "fill-color": t.brand, "fill-opacity": 0.08 }} />
        <Layer id="radius-line" type="line" paint={{ "line-color": t.brand, "line-opacity": 0.6, "line-width": 2, "line-dasharray": [2, 2] }} />
      </Source>

      <Source
        id="nearby"
        type="geojson"
        data={data}
        cluster
        clusterRadius={55}
        clusterMaxZoom={14}
        clusterProperties={{ locality: [["coalesce", ["accumulated"], ["get", "locality"]], ["get", "locality"]] }}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": t.sun,
            "circle-opacity": 1,
            "circle-stroke-color": t.ink,
            "circle-stroke-width": 3,
            "circle-radius": ["step", ["get", "point_count"], 22, 10, 28, 30, 36],
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 15,
            "text-allow-overlap": true,
          }}
          paint={{ "text-color": t.ink }}
        />
        <Layer
          id="cluster-label"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["concat", ["to-string", ["get", "point_count"]], " people", ["case", ["has", "locality"], ["concat", " in ", ["get", "locality"]], ""]],
            "text-font": ["Noto Sans Bold"],
            "text-size": 12,
            "text-offset": [0, 2.6],
            "text-optional": true,
          }}
          paint={{ "text-color": t.text, "text-halo-color": t.bg, "text-halo-width": 1.8 }}
        />
      </Source>

      {me.point && (
        <Marker longitude={me.point[0]} latitude={me.point[1]} anchor="center">
          <span className="relative grid size-12 place-items-center" aria-label="You (approximate)">
            <span className="absolute inset-0 rounded-full bg-brand/25 animate-radar" />
            <span className="relative size-9 overflow-hidden rounded-full border-2 border-white/80 bg-brand shadow-[var(--pop-shadow-sm)]">
              {me.photo && <img src={cldUrl(me.photo, 96, { square: true })} alt="" className="size-full object-cover" />}
            </span>
          </span>
        </Marker>
      )}

      {visible.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        return (
          <Marker key={p.id} longitude={lng} latitude={lat} anchor="bottom" onClick={(e) => (e.originalEvent.stopPropagation(), onSelect(f))}>
            {p.kind === "flat" ? (
              <button className="flex flex-col items-center" aria-label={`Flat in ${p.locality ?? "this area"}, ${p.rentLabel ?? ""}, ${p.score}% match`}>
                <span className="flex items-center gap-1 rounded-full bg-[var(--ink)] px-2.5 py-1.5 text-xs font-extrabold text-[var(--bg)] shadow-[0_0_18px_var(--brand-glow)]">
                  <Home className="size-3.5" /> {p.rentLabel ?? "Flat"}
                </span>
                <span className="-mt-[5px] size-2.5 rotate-45 bg-[var(--ink)]" />
              </button>
            ) : (
              <button
                className={cn("grid size-12 place-items-center rounded-full border border-[var(--pop-border)] p-[2px] shadow-[var(--pop-shadow-sm)] transition-transform active:scale-90")}
                style={{ background: RING[scoreTone(p.score)] }}
                aria-label={`${p.name}, ${p.age}, ${p.score}% match, ${p.distanceLabel}`}
              >
                <span className="block size-full overflow-hidden rounded-full border-2 border-white/80 bg-surface-2">
                  {p.photo && <img src={cldUrl(p.photo, 96, { square: true })} alt="" loading="lazy" className="size-full object-cover" />}
                </span>
              </button>
            )}
          </Marker>
        );
      })}
    </Map>
  );
});

export default MapCanvas;
