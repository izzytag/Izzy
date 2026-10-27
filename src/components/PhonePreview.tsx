import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { PublicProfile, type PublicData } from "./PublicProfile";
import { CatalogueCard } from "./CatalogueCard";
import { waLink, type ThemeId } from "@/lib/themes";

/**
 * Live preview: a phone frame around the seller's real page, with
 * working in-preview navigation. The preview never navigates away
 * from the dashboard: "Visit my Shop" switches this frame to the
 * shop view, and "← Back to main page" switches it back.
 * Tapping a product opens the existing details dialog; closing it
 * returns to whichever preview view was open, because the view
 * state lives here and is untouched by the dialog.
 */
export function PhonePreview(props: { data: PublicData; theme: ThemeId; showBranding: boolean }) {
  const { data, theme, showBranding } = props;
  const [view, setView] = useState<"main" | "shop">("main");
  // Dashboard preview rows come from linksQuery and carry `enabled`;
  // public-page rows omit it and are treated as enabled, matching
  // PublicProfile's mode logic.
  const rows = data.links as (typeof data.links[number] & { enabled?: boolean | null })[];
  const products = (rows ?? []).filter(
    (l) => l.enabled !== false && (l.kind === "product" || l.kind === "service"),
  );
  const hasShop = products.length > 0;
  // If the seller stops having products (e.g. removes them all), the
  // shop view no longer exists — fall back to the main view.
  const effectiveView = view === "shop" && hasShop ? "shop" : "main";
  const name = data.display_name || data.username || "";
  const btn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 py-3.5 text-center text-base font-semibold text-page-btn-fg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";
  const waBtn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-page-fg px-5 py-3.5 text-center text-base font-semibold text-page-bg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Live preview{effectiveView === "shop" ? " — Shop" : " — Main page"}
      </p>
      <div className="h-[560px] overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
        <div className="h-full overflow-y-auto">
          {effectiveView === "main" ? (
            <PublicProfile
              data={data}
              theme={theme}
              showBranding={showBranding}
              compact
              shopHref={hasShop ? `/${data.username ?? ""}/shop` : null}
              onShopClick={hasShop ? () => setView("shop") : null}
            />
          ) : (
            <div className={`theme-${theme} min-h-full bg-page-bg text-page-fg`}>
              <div className="mx-auto flex w-full flex-col px-4 py-8">
                {/* Shop view header: same horizontal store header as the
                    real shop page — logo beside the store name, bio
                    under the name, no @username line. */}
                <div className="flex w-full items-start gap-4">
                  {data.avatar_url ? (
                    <img src={data.avatar_url} alt={name} className="h-16 w-16 shrink-0 rounded-full object-cover shadow-pin ring-4 ring-white/70" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-page-btn text-2xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70">{name.charAt(0).toUpperCase() || "?"}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-[28px] font-bold leading-tight">{name}</h1>
                    {data.bio && <p className="mt-1 text-base leading-relaxed text-page-muted">{data.bio}</p>}
                  </div>
                </div>

                <div className="mt-5 flex w-full flex-col gap-3">
                  <button type="button" onClick={() => setView("main")} className={btn}>
                    ← Back to main page
                  </button>
                  {data.whatsapp && (
                    <a href={waLink(data.whatsapp)} target="_blank" rel="noopener noreferrer" className={waBtn}>
                      <MessageCircle className="h-5 w-5" /> WhatsApp me
                    </a>
                  )}
                </div>

                <h2 className="mt-8 w-full text-center text-2xl font-bold">Shop</h2>
                <p className="mt-1 w-full text-center text-base text-page-muted">Tap a product to see its details, then order on WhatsApp. No payment is taken here.</p>

                {products.length === 0 ? (
                  <p className="mx-auto mt-6 w-full rounded-[28px] border border-page-border bg-page-btn p-6 text-center text-base text-page-btn-fg shadow-sm">
                    No products yet.
                  </p>
                ) : (
                  <div className="mt-6 w-full columns-2 gap-4">
                    {products.map((p) => (
                      <CatalogueCard key={p.id} item={p} whatsapp={data.whatsapp} pageUrl={`/${data.username ?? ""}`} />
                    ))}
                  </div>
                )}

                {showBranding && (
                  <p className="mt-8 text-center text-base font-semibold text-page-muted">Made with Izzy</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
