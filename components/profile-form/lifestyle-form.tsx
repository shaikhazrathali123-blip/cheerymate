"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lifestyleSchema, type LifestyleInput } from "@/lib/validators";
import { LIFESTYLE } from "@/lib/constants";
import { ChipGroup } from "@/components/ui/chip";
import type { StepFormProps } from "./basics-form";

export function LifestyleForm({ formId, defaults, onValid }: StepFormProps<LifestyleInput>) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(lifestyleSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaults as any,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = (errors.lifestyle ?? {}) as Record<string, any>;

  return (
    <form id={formId} onSubmit={handleSubmit((d) => onValid(d as LifestyleInput))} className="space-y-6" noValidate>
      {LIFESTYLE.map((q) => (
        <fieldset key={q.key} className="space-y-3">
          <legend className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <span aria-hidden className="text-lg">{q.emoji}</span> {q.label}
            {q.optional && <span className="text-xs font-normal text-muted">(optional)</span>}
          </legend>
          <Controller
            control={control}
            name={`lifestyle.${q.key}` as const}
            render={({ field }) => (
              <ChipGroup
                size="sm"
                label={q.label}
                options={q.options}
                value={field.value as string | undefined}
                onChange={(v) => field.onChange(q.optional && field.value === v ? undefined : v)}
              />
            )}
          />
          {errs[q.key]?.message && <p role="alert" className="text-sm font-medium text-danger">{errs[q.key].message}</p>}
        </fieldset>
      ))}
    </form>
  );
}
