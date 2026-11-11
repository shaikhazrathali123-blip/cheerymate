"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PinBlobIcon as Building2, HouseIcon as KeyRound } from "@/components/icons";
import { housingSchema, type HousingInput } from "@/lib/validators";
import { CITIES, FURNISHING, LIMITS, ROOM_TYPES, getCity } from "@/lib/constants";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input, Select } from "@/components/ui/misc";
import { cn, formatRupees } from "@/lib/utils";
import { PhotoPicker } from "./photo-picker";
import type { StepFormProps } from "./basics-form";

const BUDGET_PRESETS = [
  [5000, 10000],
  [10000, 15000],
  [15000, 25000],
  [25000, 40000],
] as const;

export function HousingForm({ formId, defaults, onValid }: StepFormProps<HousingInput>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = defaults as any;
  const initial = d?.moveInDate instanceof Date ? { ...d, moveInDate: d.moveInDate.toISOString().slice(0, 10) } : d;
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(housingSchema),
    defaultValues: initial,
  });
  const lookingType = watch("lookingType");
  const cityId = watch("city");
  const city = getCity(cityId);
  const [bMin, bMax] = [Number(watch("budgetMin")), Number(watch("budgetMax"))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatErr = (errors as any).flat;

  return (
    <form id={formId} onSubmit={handleSubmit((d) => onValid(d as HousingInput))} className="space-y-7" noValidate>
      <Field label="What are you looking for?" error={errors.lookingType?.message}>
        <Controller control={control} name="lookingType" render={({ field }) => (
          <div className="grid gap-3" role="radiogroup" aria-label="Looking type">
            {[
              { v: "has_flat", t: "I have a flat, need a roommate", d: "List your room and find someone great to share it with.", I: KeyRound },
              { v: "needs_flat", t: "Looking for a flat + roommate", d: "Find people with a room, or team up to rent together.", I: Building2 },
            ].map(({ v, t, d, I }) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={field.value === v}
                onClick={() => field.onChange(v)}
                className={cn(
                  "flex items-start gap-3 rounded-3xl border-2 p-4 text-left transition-all active:scale-[0.99]",
                  field.value === v ? "border-brand bg-brand-soft shadow-[0_0_24px_var(--brand-glow)]" : "border-line bg-surface",
                )}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", field.value === v ? "bg-brand text-white" : "bg-surface-2 text-ink-2")}>
                  <I className="size-5" />
                </span>
                <span>
                  <span className="block font-bold text-ink">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </button>
            ))}
          </div>
        )} />
      </Field>

      <Field label="City" error={errors.city?.message}>
        <Controller control={control} name="city" render={({ field }) => (
          <ChipGroup
            size="sm"
            label="City"
            options={CITIES.map((c) => ({ value: c.id, label: c.name }))}
            value={field.value}
            onChange={(v) => {
              if (v !== field.value) {
                setValue("localities", []);
                setValue("flat.locality", undefined);
              }
              field.onChange(v);
            }}
          />
        )} />
      </Field>

      {city && (
        <Field label="Preferred localities" error={errors.localities?.message as string} hint="Pick up to 8.">
          <Controller control={control} name="localities" render={({ field }) => (
            <ChipGroup
              multiple
              size="sm"
              label="Localities"
              options={city.localities.map((l) => ({ value: l.name, label: l.name }))}
              value={field.value ?? []}
              onChange={(v) => {
                const cur: string[] = field.value ?? [];
                field.onChange(cur.includes(v) ? cur.filter((x) => x !== v) : cur.length < 8 ? [...cur, v] : cur);
              }}
            />
          )} />
        </Field>
      )}

      <Field label="Monthly budget (your share)" error={errors.budgetMax?.message || errors.budgetMin?.message}>
        <div className="mb-3 flex flex-wrap gap-2">
          {BUDGET_PRESETS.map(([a, b]) => (
            <button
              key={a}
              type="button"
              onClick={() => (setValue("budgetMin", a, { shouldValidate: true }), setValue("budgetMax", b, { shouldValidate: true }))}
              className={cn(
                "min-h-[36px] rounded-full border px-3.5 text-sm font-medium",
                bMin === a && bMax === b ? "chip-active border-transparent" : "border-line bg-surface",
              )}
            >
              ₹{a / 1000}k–{b / 1000}k
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Min ₹</span>
            <Input type="number" inputMode="numeric" step={500} {...register("budgetMin")} aria-label="Minimum budget" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Max ₹</span>
            <Input type="number" inputMode="numeric" step={500} {...register("budgetMax")} aria-label="Maximum budget" />
          </label>
        </div>
        {bMin > 0 && bMax > 0 && <p className="text-sm text-muted">{formatRupees(bMin)} – {formatRupees(bMax)} per month</p>}
      </Field>

      <Field label="Move-in date" htmlFor="movein" error={errors.moveInDate?.message}>
        <Input id="movein" type="date" min={new Date().toISOString().slice(0, 10)} {...register("moveInDate")} />
      </Field>

      <Field label="Room type" error={errors.roomType?.message}>
        <Controller control={control} name="roomType" render={({ field }) => (
          <ChipGroup label="Room type" options={ROOM_TYPES} value={field.value} onChange={field.onChange} />
        )} />
      </Field>

      {lookingType === "has_flat" && (
        <section className="space-y-6 rounded-3xl border border-line bg-surface p-4">
          <div>
            <h3 className="font-bold text-ink">About your flat</h3>
            <p className="text-sm text-muted">We only ever show the locality — never your address.</p>
          </div>
          {flatErr?.message && <p role="alert" className="text-sm font-medium text-danger">{flatErr.message}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rent for the room ₹" htmlFor="rent">
              <Input id="rent" type="number" inputMode="numeric" step={500} {...register("flat.rent")} />
            </Field>
            <Field label="Deposit ₹" htmlFor="deposit">
              <Input id="deposit" type="number" inputMode="numeric" step={1000} {...register("flat.deposit")} />
            </Field>
          </div>
          <Field label="Furnishing">
            <Controller control={control} name="flat.furnishing" render={({ field }) => (
              <ChipGroup size="sm" label="Furnishing" options={FURNISHING} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="Locality" htmlFor="flat-loc">
            <Select id="flat-loc" {...register("flat.locality")} disabled={!city}>
              <option value="">{city ? "Select locality" : "Choose a city first"}</option>
              {city?.localities.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="Flat photos (up to 6)">
            <Controller control={control} name="flat.photos" render={({ field }) => (
              <PhotoPicker value={field.value ?? []} onChange={field.onChange} max={LIMITS.maxFlatPhotos} kind="flat" label="Flat photo" />
            )} />
          </Field>
        </section>
      )}
    </form>
  );
}
