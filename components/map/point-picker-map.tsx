"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { PinBlobIcon as MapPin } from "@/components/icons";
import { useDark } from "@/hooks/use-dark";
import { brandMapStyle, mapStyleUrl } from "@/lib/map-style";

/** Small tap-to-place map used to pick a locality manually (lazy-loaded). */
export default function PointPickerMap({
  center,
  value,
  onChange,
}: {
  center: [number, number];
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}) {
  const dark = useDark();
  return (
    <Map
      initialViewState={{ longitude: value?.lng ?? center[0], latitude: value?.lat ?? center[1], zoom: 12 }}
      mapStyle={mapStyleUrl(dark)}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
      onLoad={(e) => brandMapStyle(e.target)}
      onClick={(e: MapLayerMouseEvent) => onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
      cursor="crosshair"
    >
      {value && (
        <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
          <div className="relative">
            <span className="absolute left-1/2 top-full size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20" />
            <MapPin active className="relative size-11 text-brand drop-shadow-[0_0_12px_var(--brand-glow)]" />
          </div>
        </Marker>
      )}
    </Map>
  );
}
