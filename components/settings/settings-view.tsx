"use client";
import { useState, useTransition } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { PinBlobIcon as MapPin } from "@/components/icons";
import { toast } from "sonner";
import { Card, Input, SectionTitle } from "@/components/ui/misc";
import { SwitchRow } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { LocationControls } from "@/components/map/location-controls";
import { InstallButton } from "@/components/pwa/install-banner";
import { clearLocation, setMapSettings } from "@/actions/location";
import { deleteAccount, setNotificationPrefs, signOutAction } from "@/actions/settings";
import { usePush } from "@/hooks/use-push";
import { formatRelative } from "@/lib/utils";

type Initial = {
  showOnMap: boolean;
  ghostMode: boolean;
  mapVisibleToWomenOnly: boolean;
  notifyMatches: boolean;
  notifyMessages: boolean;
  hasLocation: boolean;
  locationLocality: string | null;
  locationUpdatedAt: string | null;
};

export function SettingsView({ initial, isFemale, cityId, email }: { initial: Initial; isFemale: boolean; cityId: string | null; email: string }) {
  const [s, setS] = useState(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const push = usePush();

  /** Optimistic toggle with rollback. */
  const toggle = async <K extends keyof Initial>(key: K, value: Initial[K], fn: () => Promise<{ ok: boolean; error?: string }>) => {
    const prev = s[key];
    setS((x) => ({ ...x, [key]: value }));
    const r = await fn();
    if (!r.ok) {
      setS((x) => ({ ...x, [key]: prev }));
      toast.error(r.error ?? "Couldn't save");
    }
  };

  return (
    <div className="space-y-6 px-5">
      <section id="map">
        <SectionTitle>Map & privacy</SectionTitle>
        <Card className="divide-y divide-line py-1">
          <SwitchRow
            title="Show me on the map"
            description="Off by default. Your spot is blurred to ~500 m."
            checked={s.showOnMap}
            label="Show me on the map"
            onCheckedChange={(v) => toggle("showOnMap", v, () => setMapSettings({ showOnMap: v }))}
          />
          <SwitchRow
            title="Ghost mode"
            description="Instantly hide from the map without changing anything else."
            checked={s.ghostMode}
            label="Ghost mode"
            onCheckedChange={(v) => toggle("ghostMode", v, () => setMapSettings({ ghostMode: v }))}
          />
          {isFemale && (
            <SwitchRow
              title="Only show me to women"
              description="Men won't see you on the map."
              checked={s.mapVisibleToWomenOnly}
              label="Only show me to women"
              onCheckedChange={(v) => toggle("mapVisibleToWomenOnly", v, () => setMapSettings({ mapVisibleToWomenOnly: v }))}
            />
          )}
          <div className="space-y-3 py-4">
            <p className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-brand" /> My approximate location
            </p>
            <p className="text-sm text-muted">
              {s.hasLocation
                ? `Near ${s.locationLocality ?? "your area"}${s.locationUpdatedAt ? ` · updated ${formatRelative(s.locationUpdatedAt)} ago` : ""}. We never store your exact location.`
                : "Not set. The map still works — centred on your city."}
            </p>
            <LocationControls
              cityId={cityId}
              onSaved={(r) => setS((x) => ({ ...x, hasLocation: true, locationLocality: r.locality, locationUpdatedAt: new Date().toISOString() }))}
            />
            {s.hasLocation && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={async () => {
                  const r = await clearLocation();
                  if (!r.ok) return toast.error(r.error);
                  setS((x) => ({ ...x, hasLocation: false, showOnMap: false, locationLocality: null }));
                  toast.success("Location cleared");
                }}
              >
                Clear my location
              </Button>
            )}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Notifications</SectionTitle>
        <Card className="divide-y divide-line py-1">
          <SwitchRow
            title="Push on this device"
            description={
              push.state === "ios-needs-install"
                ? "On iPhone, add Cherrymate to your Home Screen first (iOS 16.4+)."
                : push.state === "denied"
                  ? "Blocked in your browser settings."
                  : push.state === "unsupported"
                    ? "Not supported in this browser."
                    : "Get notified about matches and messages."
            }
            checked={push.subscribed}
            disabled={["unsupported", "ios-needs-install", "denied"].includes(push.state)}
            label="Push notifications on this device"
            onCheckedChange={async (v) => {
              try {
                if (v) await push.subscribe();
                else await push.unsubscribe();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          />
          <SwitchRow
            title="New matches"
            checked={s.notifyMatches}
            label="Notify me about new matches"
            onCheckedChange={(v) => toggle("notifyMatches", v, () => setNotificationPrefs({ notifyMatches: v }))}
          />
          <SwitchRow
            title="New messages"
            checked={s.notifyMessages}
            label="Notify me about new messages"
            onCheckedChange={(v) => toggle("notifyMessages", v, () => setNotificationPrefs({ notifyMessages: v }))}
          />
        </Card>
      </section>

      <section>
        <SectionTitle>App</SectionTitle>
        <Card className="space-y-3">
          <p className="font-semibold">Install Cherrymate</p>
          <InstallButton />
        </Card>
      </section>

      <section>
        <SectionTitle>Account</SectionTitle>
        <Card className="space-y-3">
          <p className="text-sm text-muted">Signed in with Google{email ? ` as ${email}` : ""}. Your email is never shown to anyone.</p>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" block>
              <LogOut className="size-4" /> Sign out
            </Button>
          </form>
          <Button variant="ghost" block className="text-danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete account
          </Button>
        </Card>
      </section>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete your account?" description="This permanently removes your profile, photos, swipes, matches, messages and location. It can't be undone.">
        <div className="space-y-4 pb-2">
          <label className="block text-sm font-semibold" htmlFor="del-confirm">
            Type DELETE to confirm
          </label>
          <Input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" autoComplete="off" />
          <Button
            variant="danger"
            size="lg"
            block
            disabled={confirm !== "DELETE"}
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteAccount(confirm);
                if (r && !r.ok) toast.error(r.error);
              })
            }
          >
            Permanently delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
