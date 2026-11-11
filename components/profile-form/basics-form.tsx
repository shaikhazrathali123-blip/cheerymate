"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { basicsSchema, type BasicsInput } from "@/lib/validators";
import { GENDERS, LANGUAGES, LIMITS, OCCUPATIONS } from "@/lib/constants";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input, Textarea } from "@/components/ui/misc";
import { PhotoPicker } from "./photo-picker";

export type StepFormProps<T> = {
  formId: string;
  defaults: unknown;
  onValid: (data: T) => void | Promise<void>;
};

export function BasicsForm({ formId, defaults, onValid }: StepFormProps<BasicsInput>) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(basicsSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaults as any,
  });
  const bio = watch("bio") ?? "";
  const occupation = watch("occupation");

  return (
    <form id={formId} onSubmit={handleSubmit((d) => onValid(d as BasicsInput))} className="space-y-7" noValidate>
      <Field label="Photos (1–4)" error={errors.photos?.message as string} hint="Clear, recent photos of your face get far more matches.">
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotoPicker value={field.value ?? []} onChange={field.onChange} max={LIMITS.maxPhotos} kind="profile" label="Profile photo" />
          )}
        />
      </Field>

      <Field label="First name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="given-name" {...register("name")} />
      </Field>

      <Field label="Age" htmlFor="age" error={errors.age?.message} hint="You must be 18 or older to use Cherrymate.">
        <Input id="age" type="number" inputMode="numeric" min={18} max={80} {...register("age")} />
      </Field>

      <Field label="Gender" error={errors.gender?.message}>
        <Controller control={control} name="gender" render={({ field }) => (
          <ChipGroup label="Gender" options={GENDERS} value={field.value} onChange={field.onChange} />
        )} />
      </Field>

      <Field label="What do you do?" error={errors.occupation?.message}>
        <Controller control={control} name="occupation" render={({ field }) => (
          <ChipGroup label="Occupation" options={OCCUPATIONS} value={field.value} onChange={field.onChange} />
        )} />
      </Field>

      <Field label={occupation === "student" ? "College" : "Company"} htmlFor="org" error={errors.organisation?.message}>
        <Input id="org" placeholder={occupation === "student" ? "e.g. Christ University" : "e.g. Infosys"} {...register("organisation")} />
      </Field>

      <Field label="Short bio" htmlFor="bio" error={errors.bio?.message} hint={`${bio.length}/${LIMITS.bioMax}`}>
        <Textarea id="bio" maxLength={LIMITS.bioMax} placeholder="Weekend trekker, makes great chai, keeps the kitchen clean…" {...register("bio")} />
      </Field>

      <Field label="Languages you speak" error={errors.languages?.message as string}>
        <Controller control={control} name="languages" render={({ field }) => (
          <ChipGroup
            multiple
            size="sm"
            label="Languages"
            options={LANGUAGES.map((l) => ({ value: l, label: l }))}
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
