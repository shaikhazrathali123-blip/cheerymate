import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { toFormDefaults } from "@/lib/profile-defaults";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = { title: "Set up your profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requirePageUser({ onboarded: false });
  if (user.onboardingComplete) redirect("/discover");
  return <OnboardingWizard defaults={toFormDefaults(user)} initialStep={Math.min(user.onboardingStep ?? 0, 4)} />;
}
