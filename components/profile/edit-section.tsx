"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackIcon as ChevronLeft } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BasicsForm } from "@/components/profile-form/basics-form";
import { HousingForm } from "@/components/profile-form/housing-form";
import { LifestyleForm } from "@/components/profile-form/lifestyle-form";
import { PreferencesForm } from "@/components/profile-form/preferences-form";
import { updateProfileSection } from "@/actions/profile";

const TITLES = { basics: "Basics & photos", housing: "Housing plan", lifestyle: "Lifestyle", preferences: "Roommate preferences" };
type S = keyof typeof TITLES;

export function EditSection({ section, defaults }: { section: S; defaults: unknown }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const formId = `edit-${section}`;

  const save = async (values: unknown) => {
    setSaving(true);
    const r = await updateProfileSection(section, values);
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Saved");
    router.push("/profile");
    router.refresh();
  };

  const props = { formId, defaults, onValid: save };
  return (
    <div className="mx-auto max-w-lg pb-44">
      <header className="pt-safe sticky top-0 z-10 flex items-center gap-2 bg-bg/85 px-3 pb-2 backdrop-blur-xl">
        <Link href="/profile" className="tap grid place-items-center rounded-full" aria-label="Back to profile">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-lg font-bold">{TITLES[section]}</h1>
      </header>
      <div className="px-5 pt-3">
        {section === "basics" && <BasicsForm {...props} />}
        {section === "housing" && <HousingForm {...props} />}
        {section === "lifestyle" && <LifestyleForm {...props} />}
        {section === "preferences" && <PreferencesForm {...props} />}
      </div>
      <div className="fixed inset-x-0 z-30 mx-auto max-w-lg px-5 lg:bottom-6" style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 1.25rem)" }}>
        <Button type="submit" form={formId} size="lg" block loading={saving} className="shadow-card">
          Save changes
        </Button>
      </div>
    </div>
  );
}
