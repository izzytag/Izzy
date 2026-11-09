import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: SettingsPage,
});

/**
 * Settings — real account information only: the signed-in email,
 * the current plan (from the same account/billing state as
 * everywhere else) with a path to the Plan page, and logout.
 */
function SettingsPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const region = useRegion();
  const p = acc.profile;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
        <h2 className="text-xl font-bold">Session</h2>
        <p className="mt-2 text-base text-muted-foreground">Log out of izzy on this device.</p>
        <Button variant="outline" onClick={signOut} className="mt-4 min-h-[44px]"><LogOut className="h-4 w-4" /> Log out</Button>
      </section>
    </div>
  );
}
