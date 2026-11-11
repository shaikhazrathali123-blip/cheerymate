"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preferencesSchema, type PreferencesInput } from "@/lib/validators";
import { DEALBREAKERS } from "@/lib/constants";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/misc";
import type { StepFormProps } from "./basics-form";

export function PreferencesForm({ formId, defaults, onValid }: StepFormProps<PreferencesInput>) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(preferencesSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaults as any,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = errors.preferences as any;

  return (
    <form id={formId} onSubmit={handleSubmit((d) => onValid(d as PreferencesInput))} className="space-y-7" noValidate>
      <Field label="Preferred roommate gender">
        <Controller control={control} name="preferences.roommateGender" render={({ field }) => (
          <ChipGroup
            label="Preferred roommate gender"
            options={[{ value: "same", label: "Same as me" }, { value: "any", label: "Anyone" }]}
            value={field.value}
            onChange={field.onChange}
          />
        )} />
      </Field>

      <Field label="Roommate age range" error={e?.ageMax?.message || e?.ageMin?.message}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">From</span>
            <Input type="number" inputMode="numeric" min={18} max={80} {...register("preferences.ageMin")} aria-label="Minimum age" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">To</span>
            <Input type="number" inputMode="numeric" min={18} max={80} {...register("preferences.ageMax")} aria-label="Maximum age" />
          </label>
        </div>
      </Field>

      <Field label="Dealbreakers" hint="We'll never show you people who break these — and they won't see you if you break theirs.">
        <Controller control={control} name="preferences.dealbreakers" render={({ field }) => (
          <ChipGroup
            multiple
            size="sm"
            label="Dealbreakers"
            options={DEALBREAKERS}
            value={field.value ?? []}
            onChange={(v) => {
              const cur: string[] = field.value ?? [];
              field.onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
            }}
          />
        )} />
      </Field>
    </form>
  );
}
