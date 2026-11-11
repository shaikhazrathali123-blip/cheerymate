"use client";
import { useState } from "react";
import { GhostIcon as EyeOff, PinBlobIcon as MapPin, ShieldIcon as ShieldCheck } from "@/components/icons";
import { Radar, DEMO_DOTS } from "@/components/brand/radar";
import { SwitchRow } from "@/components/ui/switch";
import { LocationControls } from "@/components/map/location-controls";

type Defaults = { showOnMap: boolean; mapVisibleToWomenOnly: boolean; hasLocation: boolean; locationLocality: string | null };

export function MapVisibilityStep({
  formId,
  defaults,
  gender,
  cityId,
  onValid,
}: {
  formId: string;
  defaults: Defaults;
  gender: string | null;
  cityId: string | null;
  onValid: (v: { showOnMap: boolean; mapVisibleToWomenOnly: boolean }) => void;
}) {
  const [show, setShow] = useState(defaults.showOnMap);
  const [womenOnly, setWomenOnly] = useState(defaults.mapVisibleToWomenOnly);
  const [loc, setLoc] = useState<string | null>(defaults.hasLocation ? defaults.locationLocality ?? "Set" : null);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onValid({ showOnMap: show && !!loc, mapVisibleToWomenOnly: gender === "female" && womenOnly });
      }}
      className="space-y-6"
    >
      <Radar dots={DEMO_DOTS.slice(0, 4)} className="max-w-[260px]" />

      <ul className="space-y-3 text-[15px]">
        <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand" /> See compatible people and available flats around you.</li>
        <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /> Your spot is blurred to a ~500 m area. Nobody ever sees your exact or live location.</li>
        <li className="flex gap-3"><EyeOff className="mt-0.5 size-5 shrink-0 text-brand" /> Off by default. Hide instantly any time with Ghost mode.</li>
      </ul>

      <div className="rounded-3xl border border-line bg-surface px-4">
        <SwitchRow title="Show me on the map" description="Only people who pass your filters can see you." checked={show} onCheckedChange={setShow} label="Show me on the map" />
        {gender === "female" && (
          <div className="border-t border-line">
            <SwitchRow title="Only show me to women" checked={womenOnly} onCheckedChange={setWomenOnly} label="Only show me to women" />
          </div>
        )}
      </div>

      {show && (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold">Where should we place you?</p>
          {loc && <p className="text-sm text-success">✓ Location set{loc !== "Set" ? ` — near ${loc}` : ""} (approximate)</p>}
          <LocationControls cityId={cityId} onSaved={(r) => setLoc(r.locality ?? "Set")} />
          {!loc && <p className="text-sm text-muted">Set a location to appear on the map, or skip for now.</p>}
        </div>
      )}
    </form>
  );
}
