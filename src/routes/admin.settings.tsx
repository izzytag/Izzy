import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminPlatformConfig } from "@/lib/admin.functions";
import { AdminCard, AdminError, AdminLoading } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 py-2.5">
      <dt className="w-56 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value}
        {hint && <span className="block text-sm font-normal text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}

/**
 * Platform settings — READ-ONLY on purpose (brief §8). Plan prices,
 * limits and provider configuration live in code and in the payment
 * provider's dashboard; changing them is a deployment or a provider
 * change, not a panel toggle. This page reports the current state —
 * configured / not-configured only, never a secret value.
 */
function AdminSettingsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: () => adminPlatformConfig(),
  });
  if (isPending) return <AdminLoading />;
  if (error || !data) return <AdminError message={error instanceof Error ? error.message : "Please try again."} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Platform settings</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Current configuration, shown read-only. Prices and limits are set in the app code; payment providers are
        configured on the server and in the provider's own dashboard. Nothing here can be edited from the panel,
        and no secret values are ever displayed.
      </p>

      <AdminCard title="Plans">
        <dl className="divide-y">
          <Row label="Pro price — India" value={`₹${data.proPriceInr}/month`} hint="Via Razorpay subscription checkout" />
          <Row label="Pro price — rest of world" value={`$${data.proPriceUsd}/month`} hint="Checkout not built yet — the upgrade button shows a coming-soon state" />
          <Row label="Free catalogue limit" value={`${data.freeLinkLimit} products & services`} hint="Enforced by the database trigger, not just the UI" />
          <Row label="Free-for-testing mode" value={data.testingFree ? "ON — everyone gets Pro display behaviour" : "Off — live payments"} />
          <Row label="Analytics windows" value="Free: last 7 days · Pro: last 30 days" />
        </dl>
      </AdminCard>

      <AdminCard title="Providers & access">
        <dl className="divide-y">
          <Row label="Razorpay" value={data.razorpayConfigured ? "Configured on the server" : "Not configured — checkout shows a 'not connected' message"} />
          <Row label="Stripe" value={data.stripeConfigured ? "Configured" : "Not integrated"} />
          <Row label="Admin allowlist (ADMIN_EMAILS)" value={data.adminAllowlistEnabled ? "Enabled — you're signed in through it" : "Not set"} />
          <Row label="Support inbox" value={data.supportInbox} />
          <Row
            label="Email confirmation & password reset"
            value="Handled by Supabase Auth"
            hint="Confirmation on/off and reset emails are managed in the Supabase dashboard, not from this panel"
          />
        </dl>
      </AdminCard>
    </div>
  );
}
