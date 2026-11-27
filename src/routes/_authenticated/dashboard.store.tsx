import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { accountQuery, linksQuery } from "@/lib/account";
import { effectiveTheme, THEMES } from "@/lib/themes";
import { TESTING_FREE, testingBanner, effectiveIsPro } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { BusinessDetails } from "@/components/BusinessDetails";
import { PhonePreview } from "@/components/PhonePreview";
import { DashboardLoading } from "@/components/DashboardLoading";

export const Route = createFileRoute("/_authenticated/dashboard/store")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  pendingComponent: DashboardLoading,
  component: MyShopPage,
});

/**
 * My Shop — Preview and Edit modes (2026-11-27).
 * Preview (selected by default) shows the shop as buyers see it.
 * Edit shows the business details — logo, name, category, short
 * description, WhatsApp number — tap a detail to change it, then
 * tap Save to update. Business details also live on the Home
 * tab; both edit the same profile. Shop look stays as one row
 * into the appearance page.
 */
function MyShopPage() {
  const region = useRegion();
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const p = acc.profile;
  const pro = effectiveIsPro(acc.isPro);
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const preview = {
    ...p,
    socials: (p.socials as Record<string, string>) ?? {},
    links: links.filter((l) => l.enabled && l.kind !== "link"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">My Shop</h1>
        <p className="mt-1 text-base text-muted-foreground">See your shop as buyers see it, or tap Edit to change your details.</p>
      </div>

      {/* Preview / Edit toggle — Preview selected by default */}
      <div className="flex rounded-full border bg-card p-1" role="tablist" aria-label="My Shop mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          onClick={() => setMode("preview")}
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors ${mode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "edit"}
          onClick={() => setMode("edit")}
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors ${mode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>

      {TESTING_FREE && (
        <p className="rounded-xl border bg-primary-soft p-4 text-base font-medium text-accent-foreground">{testingBanner(region)}</p>
      )}

      {mode === "preview" ? (
        <div className="mx-auto w-full max-w-[420px]">
          <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
        </div>
      ) : (
        <BusinessDetails profile={p} userId={acc.user.id} />
      )}

      {/* Shop look — one row into the existing appearance page */}
      <section className="rounded-xl border bg-card">
        <Link to="/dashboard/appearance" className="flex min-h-[56px] items-center gap-3 px-5 py-3 transition hover:bg-muted/60">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-5 w-5 rounded-full border bg-foreground" />
            <span className="h-5 w-5 rounded-full border bg-background" />
            <span className="h-5 w-5 rounded-full border bg-muted" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Shop look</span>
            <span className="block truncate text-sm text-muted-foreground">Theme: {THEMES.find((t) => t.id === (p.theme ?? "light"))?.name ?? "Light"} · Social links · UPI</span>
          </span>
          <span className="text-sm font-semibold text-primary">Change</span>
        </Link>
      </section>
    </div>
  );
}
