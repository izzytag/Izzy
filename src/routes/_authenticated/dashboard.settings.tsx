import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: SettingsPage,
});

/**
 * Settings — real account information only: the signed-in email,
 * a password change (via Supabase auth), the current plan (from the
 * same account/billing state as everywhere else) with a path to the
 * Plan page, privacy facts, and logout. There is no self-serve
 * account deletion, so none is offered — the privacy section points
 * to Contact for deletion requests instead.
 */
function SettingsPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const region = useRegion();
  const p = acc.profile;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters — a strong, unique password you haven't used elsewhere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The two passwords don't match.");
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      // Supabase rejects common or leaked passwords server-side;
      // surface its message rather than guessing.
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-base text-muted-foreground">Your account and plan.</p>
      </div>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Account</h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm text-muted-foreground">Signed in as</dt>
            <dd className="break-all text-base font-medium">{acc.user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Shop</dt>
            <dd className="text-base font-medium">{p.display_name || p.username} · izzytag.shop/{p.username}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Password</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Set a new password for this account. Use a strong, unique one — common or leaked passwords are rejected.
        </p>
        <div className="mt-4 max-w-md space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="settings-new-password">New password</Label>
            <Input id="settings-new-password" type="password" autoComplete="new-password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-confirm-password">Type it again</Label>
            <Input id="settings-confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {passwordError && <p className="text-sm font-medium text-destructive">{passwordError}</p>}
          <Button onClick={() => void changePassword()} disabled={changingPassword} className="min-h-[44px]">
            {changingPassword ? "Updating…" : "Update password"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Plan</h2>
          <Badge variant={acc.isPro ? "default" : "secondary"}>{acc.isPro ? "Pro" : "Free"}</Badge>
        </div>
        <p className="mt-2 text-base text-muted-foreground">
          {acc.isPro
            ? <>You're on <span className="font-medium text-foreground">izzy Pro</span> ({proPriceLine(region)}), with unlimited products and all themes.</>
            : <>You're on the <span className="font-medium text-foreground">Free plan</span>. Pro ({proPriceLine(region)}) gives you unlimited products, all themes and 30-day analytics.</>}
        </p>
        <Button asChild className="mt-4 min-h-[44px]">
          <Link to="/dashboard/upgrade">{acc.isPro ? "View your plan" : "Upgrade to Pro"}</Link>
        </Button>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Privacy &amp; data</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
          <p>
            To power your Analytics, izzy counts shop visits, product views and WhatsApp button taps on your
            shop, along with a simple source label (like Instagram or your QR code) when the link a customer
            used provides one.
          </p>
          <p>
            We don't collect your visitors' names, phone numbers or messages, and nobody can see your shop's
            analytics except you.
          </p>
          <p>
            Read the <Link to="/privacy" className="font-semibold text-primary underline">Privacy Policy</Link> and{" "}
            <Link to="/terms" className="font-semibold text-primary underline">Terms</Link> for the full picture.
            To delete your account or your data, <Link to="/contact" className="font-semibold text-primary underline">contact us</Link> and
            we'll take care of it.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Session</h2>
        <p className="mt-2 text-base text-muted-foreground">Log out of izzy on this device.</p>
        <Button variant="outline" onClick={signOut} className="mt-4 min-h-[44px]"><LogOut className="h-4 w-4" /> Log out</Button>
      </section>
    </div>
  );
}
