"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BackIcon as ChevronLeft } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BasicsForm } from "@/components/profile-form/basics-form";
import { HousingForm } from "@/components/profile-form/housing-form";
import { LifestyleForm } from "@/components/profile-form/lifestyle-form";
import { PreferencesForm } from "@/components/profile-form/preferences-form";
import { MapVisibilityStep } from "./map-step";
import { saveOnboardingStep, type Section } from "@/actions/profile";
import type { FormDefaults } from "@/lib/profile-defaults";

const STEPS: { key: Section; title: string; subtitle: string }[] = [
  { key: "basics", title: "The basics", subtitle: "Let future roommates get to know you." },
  { key: "housing", title: "Your housing plan", subtitle: "Where, when and how much." },
  { key: "lifestyle", title: "How you live", subtitle: "Honest answers = happier homes." },
  { key: "preferences", title: "Your roommate", subtitle: "Who would you love to live with?" },
  { key: "map", title: "Nearby map", subtitle: "Optional — you can skip this." },
];

export function OnboardingWizard({ defaults, initialStep }: { defaults: FormDefaults; initialStep: number }) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(defaults);
  const formId = `onb-${STEPS[step].key}`;
  const last = step === STEPS.length - 1;

  const save = async (section: Section, values: unknown, complete = false) => {
    setSaving(true);
    const res = await saveOnboardingStep(section, values, complete);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    return true;
  };

  const next = async (values: unknown) => {
    const section = STEPS[step].key;
    if (!(await save(section, values, last))) return;
    setData((d) => {
      const copy = { ...d } as Record<string, unknown>;
      copy[section] = values;
      if (section === "housing") copy.city = (values as { city: string }).city;
      if (section === "basics") copy.gender = (values as { gender: string }).gender;
      return copy as FormDefaults;
    });
    if (last) {
      toast.success("You're all set! 🍒");
      router.replace("/discover");
      router.refresh();
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0 });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex min-h-screen-d max-w-lg flex-col page-glow">
      <header className="pt-safe sticky top-0 z-10 bg-bg/85 px-5 pb-3 backdrop-blur-xl">
        <div className="flex h-12 items-center gap-2">
          {step > 0 ? (
            <button onClick={back} className="tap -ml-2 grid place-items-center rounded-full" aria-label="Back">
              <ChevronLeft className="size-6" />
            </button>
          ) : (
            <span className="text-lg font-extrabold">🍒 Cherrymate</span>
          )}
          <span className="ml-auto text-sm font-semibold text-muted">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full border border-[var(--pop-border)] bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Onboarding progress"
        >
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand via-accent to-sun" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
        </div>
      </header>

      <div className="relative flex-1 overflow-x-hidden px-5 pb-40 pt-4">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -40, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{STEPS[step].title}</h1>
            <p className="mb-7 mt-1 text-muted">{STEPS[step].subtitle}</p>

            {step === 0 && <BasicsForm formId={formId} defaults={data.basics} onValid={next} />}
            {step === 1 && <HousingForm formId={formId} defaults={data.housing} onValid={next} />}
            {step === 2 && <LifestyleForm formId={formId} defaults={data.lifestyle} onValid={next} />}
            {step === 3 && <PreferencesForm formId={formId} defaults={data.preferences} onValid={next} />}
            {step === 4 && <MapVisibilityStep formId={formId} defaults={data.map} gender={data.gender} cityId={data.city} onValid={next} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumb-reachable actions */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-line bg-bg/90 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 0.75rem)" }}
      >
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={back} className="w-28">
              Back
            </Button>
          )}
          {last && (
            <Button variant="ghost" size="lg" disabled={saving} onClick={() => next({ showOnMap: false, mapVisibleToWomenOnly: false })}>
              Skip
            </Button>
          )}
          <Button type="submit" form={formId} size="lg" className="flex-1" loading={saving}>
            {last ? "Finish" : "Continue"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
