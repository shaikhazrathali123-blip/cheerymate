import { requirePageUser, touchActive } from "@/lib/session";
import { getUnreadTotal } from "@/lib/queries";
import { RealtimeProvider } from "@/components/shell/realtime-provider";
import { BottomNav, SideNav } from "@/components/shell/nav";
import { InstallBanner } from "@/components/pwa/install-banner";

export const dynamic = "force-dynamic";

/** Everything behind sign-in AND completed onboarding. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ onboarded: true });
  const [unread] = await Promise.all([getUnreadTotal(user._id), touchActive(user)]);

  const me = {
    id: String(user._id),
    name: (user.name ?? "").split(" ")[0],
    photo: user.photos?.[0]?.url ?? user.image ?? "",
    gender: user.gender ?? undefined,
  };

  return (
    <RealtimeProvider me={me} initialUnread={unread}>
      <div className="flex min-h-screen-d page-glow">
        <SideNav />
        <main className="relative min-w-0 flex-1">{children}</main>
      </div>
      <BottomNav />
      <InstallBanner />
    </RealtimeProvider>
  );
}
