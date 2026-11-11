"use client";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input, Select } from "@/components/ui/misc";
import { getCity } from "@/lib/constants";
import type { DiscoverFilters } from "@/types";

const KEY = "cm-filters";

export function loadFilters(): DiscoverFilters {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
export function saveFilters(f: DiscoverFilters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {}
}
export function filtersToParams(f: DiscoverFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v !== undefined && v !== "" && v !== "any" && p.set(k, String(v)));
  return p;
}
export const activeFilterCount = (f: DiscoverFilters) =>
  [f.budgetMin || f.budgetMax, f.locality, f.moveInBefore, f.lookingType && f.lookingType !== "any"].filter(Boolean).length;

/** Same filters sheet on Discover and Map. */
export function FiltersSheet({
  open,
  onOpenChange,
  cityId,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cityId: string;
  value: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
}) {
  const [f, setF] = useState<DiscoverFilters>(value);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);
  const city = getCity(cityId);
  const num = (v: string) => (v === "" ? undefined : Number(v));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description={`Showing people in ${city?.name ?? "your city"}`}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={() => setF({})}>
            Reset
          </Button>
          <Button size="lg" className="flex-1" onClick={() => (onApply(f), onOpenChange(false))}>
            Show results
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        <Field label="Looking type">
          <ChipGroup
            size="sm"
            label="Looking type"
            options={[
              { value: "any", label: "Everyone" },
              { value: "has_flat", label: "Has a flat" },
              { value: "needs_flat", label: "Needs a flat" },
            ]}
            value={f.lookingType ?? "any"}
            onChange={(v) => setF({ ...f, lookingType: v as DiscoverFilters["lookingType"] })}
          />
        </Field>
        <Field label="Budget / rent per month (₹)">
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" inputMode="numeric" placeholder="Min" aria-label="Minimum budget" value={f.budgetMin ?? ""} onChange={(e) => setF({ ...f, budgetMin: num(e.target.value) })} />
            <Input type="number" inputMode="numeric" placeholder="Max" aria-label="Maximum budget" value={f.budgetMax ?? ""} onChange={(e) => setF({ ...f, budgetMax: num(e.target.value) })} />
          </div>
        </Field>
        <Field label="Locality" htmlFor="flt-loc">
          <Select id="flt-loc" value={f.locality ?? ""} onChange={(e) => setF({ ...f, locality: e.target.value || undefined })}>
            <option value="">Any locality</option>
            {city?.localities.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Moving in by" htmlFor="flt-date">
          <Input id="flt-date" type="date" value={f.moveInBefore ?? ""} onChange={(e) => setF({ ...f, moveInBefore: e.target.value || undefined })} />
        </Field>
      </div>
    </Sheet>
  );
}
