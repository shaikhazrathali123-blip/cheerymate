"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateIcon as LocateFixed, PinBlobIcon as MapPinned } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/misc";
import { setManualLocation, updateLocation } from "@/actions/location";
import { getCity } from "@/lib/constants";

const PointPickerMap = dynamic(() => import("./point-picker-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

export function getGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Location isn't available on this device"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.code === 1 ? "Location permission denied — you can pick a locality instead." : "Couldn't get your location")),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** "Share location (GPS)" or "Pick on map" — both are fuzzed on the server before saving. */
export function LocationControls({
  cityId,
  onSaved,
}: {
  cityId: string | null;
  onSaved: (r: { lat: number; lng: number; locality: string | null }) => void;
}) {
  const [busy, setBusy] = useState<"gps" | "manual" | null>(null);
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const city = getCity(cityId);

  const useGps = async () => {
    setBusy("gps");
    try {
      const p = await getGPS();
      const r = await updateLocation(p.lat, p.lng, true);
      if (!r.ok) throw new Error(r.error);
      onSaved(r.data!);
      toast.success(`Location set${r.data?.locality ? ` near ${r.data.locality}` : ""} (approximate)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveManual = async () => {
    if (!point) return;
    setBusy("manual");
    const r = await setManualLocation(point.lat, point.lng);
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    onSaved(r.data!);
    setOpen(false);
    toast.success(`Location set${r.data?.locality ? ` near ${r.data.locality}` : ""} (approximate)`);
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="dark" onClick={useGps} loading={busy === "gps"}>
          <LocateFixed className="size-4" /> Share my location
        </Button>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <MapPinned className="size-4" /> Pick on the map
        </Button>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Pick your area"
        description="Tap the map or choose a locality. We'll blur it to ~500 m."
        full
        footer={
          <Button block size="lg" disabled={!point} loading={busy === "manual"} onClick={saveManual}>
            Use this area
          </Button>
        }
      >
        {city && (
          <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
            {city.localities.map((l) => (
              <Chip key={l.name} size="sm" className="shrink-0" active={point?.lat === l.lat && point?.lng === l.lng} onClick={() => setPoint({ lat: l.lat, lng: l.lng })}>
                {l.name}
              </Chip>
            ))}
          </div>
        )}
        <div className="h-[55dvh] overflow-hidden rounded-3xl border border-line" data-vaul-no-drag>
          {open && <PointPickerMap center={city?.center ?? [77.5946, 12.9716]} value={point} onChange={setPoint} />}
        </div>
      </Sheet>
    </>
  );
}
