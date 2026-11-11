import type { Metadata } from "next";
import { requirePageUser } from "@/lib/session";
import { toFormDefaults } from "@/lib/profile-defaults";
import { EditSection } from "@/components/profile/edit-section";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

const VALID = ["basics", "housing", "lifestyle", "preferences"] as const;
type S = (typeof VALID)[number];

export default async function EditProfilePage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section: raw } = await searchParams;
  const section: S = (VALID as readonly string[]).includes(raw ?? "") ? (raw as S) : "basics";
  const me = await requirePageUser();
  const defaults = toFormDefaults(me);
  return <EditSection section={section} defaults={defaults[section]} />;
}
