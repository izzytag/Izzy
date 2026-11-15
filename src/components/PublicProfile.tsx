import { useEffect, useState } from "react";
import { Check, Instagram, Youtube, Twitter, Linkedin, MessageCircle, IndianRupee, Link as LinkIcon, Share2, ShoppingBag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isCompleteSocial, socialUrl, upiLink, type ThemeId } from "@/lib/themes";
import { CatalogueCard } from "@/components/CatalogueCard";
import { ReportShopButton } from "@/components/ReportShopButton";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

const ICONS: Record<string, typeof Instagram> = { instagram: Instagram, youtube: Youtube, x: Twitter, linkedin: Linkedin, whatsapp: MessageCircle };

export type PublicData = {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  category?: string | null;
  avatar_url: string | null;
  socials: Record<string, string>;
  whatsapp: string | null;
  upi_id: string | null;
  links: { id: string; title: string; url: string; kind?: string; price?: string | null; description?: string | null; image_urls?: string[]; category?: string | null }[];
};

/**
 * The public storefront — the only public page Izzy has. Store header
 * (logo, store name, bio), socials, an optional UPI pay block, then the
 * catalogue: every product AND service row together in one Pinterest
 * masonry, ordered by position. Link-kind rows are never shown (the
 * server already excludes them; the filter here keeps dashboard
 * previews honest too, since they pass raw rows).
 */
export function PublicProfile({ data, theme, showBranding, onLinkClick, onProductView, compact, reportable, demoMode }: {
  data: PublicData; theme: ThemeId; showBranding: boolean; onLinkClick?: (id: string) => void; onProductView?: ((id: string) => void) | undefined; compact?: boolean; reportable?: boolean; demoMode?: boolean | undefined;
}) {
  const [showUpi, setShowUpi] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const name = data.display_name || data.username || "";
  const socials = Object.entries(data.socials || {}).filter(([k, v]) => isCompleteSocial(k, v));
  const items = data.links.filter((l) => l.kind === "product" || l.kind === "service");
  const btn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 py-3.5 text-center text-base font-semibold text-page-btn-fg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";

  // Visitor-side forwarding: the native share sheet, with the same
  // pitch text sellers share from the dashboard. Where the share
  // sheet is unavailable the link is copied instead, and the button
  // confirms it briefly.
  async function copyShopLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no further fallback on this device.
    }
  }

  async function shareShop() {
    const url = origin ? `${origin}/${data.username ?? ""}` : `https://izzytag.shop/${data.username ?? ""}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: name, text: `${name} on izzy — browse the catalogue and order on WhatsApp.`, url });
        return;
      } catch {
        return; // user closed the share sheet — not an error
      }
    }
    await copyShopLink(url);
  }

  return (
    <div className={`theme-${theme} bg-page-bg text-page-fg ${compact ? "min-h-full" : "min-h-screen"}`}>
      {/* Non-compact pages leave room at the bottom so the fixed
          WhatsApp button never covers the footer on small screens. */}
      <div className={`mx-auto flex w-full max-w-5xl flex-col px-4 ${compact ? "py-8" : "pt-10 pb-28 sm:px-5"}`}>
        {/* Store header: logo beside the store name, at the top.
            No @username here — the username stays in the URL only.
            On phones the identity is centered (logo above the name,
            share as a labeled row under the bio) so nothing crowds
            the name; the horizontal layout returns on wider
            screens. Compact mode (the narrow preview/mockup frames)
            always uses the centered layout — viewport breakpoints
            can't be trusted there, since the frame is narrow even
            on a desktop-width viewport. */}
        <div className={compact ? "flex w-full flex-col items-center gap-3 text-center" : "flex w-full flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left"}>
          {data.avatar_url && !avatarFailed ? (
            <img src={data.avatar_url} alt={name} onError={() => setAvatarFailed(true)} className="h-16 w-16 shrink-0 rounded-full object-cover shadow-pin ring-4 ring-white/70 sm:h-20 sm:w-20" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-page-btn text-2xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70 sm:h-20 sm:w-20 sm:text-3xl">{name.charAt(0).toUpperCase() || "?"}</div>
          )}
          <div className={compact ? "w-full min-w-0" : "w-full min-w-0 sm:flex-1 sm:pt-0.5"}>
            <h1 className="text-balance text-[28px] font-bold leading-[1.15] tracking-tight sm:text-[32px]">{name}</h1>
            {data.category && (
              <p className="mt-2">
                <span className="inline-flex items-center rounded-full border border-page-border bg-page-btn px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-page-btn-fg">{data.category}</span>
              </p>
            )}
            {data.bio && <p className="mt-2 text-pretty text-[15px] leading-relaxed text-page-muted sm:text-base">{data.bio}</p>}
          </div>
          {!compact && (
            <button type="button" onClick={() => void shareShop()} aria-label="Share this shop" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-page-border bg-page-btn text-page-fg shadow-sm transition hover:scale-105 active:scale-95 sm:flex">
              {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </button>
          )}
        </div>

        <button type="button" onClick={() => void shareShop()} className={compact ? "mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 text-sm font-semibold text-page-btn-fg shadow-sm transition active:scale-[0.98]" : "mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 text-sm font-semibold text-page-btn-fg shadow-sm transition active:scale-[0.98] sm:hidden"}>
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied ? "Link copied" : "Share this shop"}
        </button>

        {socials.length > 0 && (
          <div className={`mt-6 flex gap-3 ${compact ? "self-center" : "self-center sm:self-start"}`}>
            {socials.map(([k, v]) => {
              const Icon = ICONS[k] ?? LinkIcon;
              return (
                <a key={k} href={socialUrl(k, v)} target="_blank" rel="noopener noreferrer" aria-label={k} className="flex h-11 w-11 items-center justify-center rounded-full border border-page-border bg-page-btn text-page-fg shadow-sm transition hover:scale-110 active:scale-95">
                  <Icon className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        )}

        {data.upi_id && (
          <div className="mt-6 w-full sm:max-w-[420px]">
            <button type="button" onClick={() => setShowUpi((s) => !s)} className={btn}>
              <IndianRupee className="h-5 w-5" /> Pay via UPI
            </button>
            {showUpi && (
              <div className="mt-3.5 flex flex-col items-center gap-3 rounded-2xl border border-page-border bg-page-btn p-5 text-page-btn-fg">
                <div className="rounded-xl bg-card p-3"><QRCodeSVG value={upiLink(data.upi_id, name)} size={168} /></div>
                <p className="text-sm font-medium">{data.upi_id}</p>
                <p className="text-xs text-page-muted">Buyers enter the amount themselves in their UPI app.</p>
                <a href={upiLink(data.upi_id, name)} className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-page-fg px-4 py-3 text-center text-sm font-semibold text-page-bg">Tap to pay with UPI app</a>
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mx-auto mt-8 flex w-full max-w-[420px] flex-col items-center gap-3 rounded-[28px] border border-page-border bg-page-btn p-8 text-center text-page-btn-fg shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-page-bg"><ShoppingBag className="h-6 w-6 text-page-muted" /></div>
            <p className="text-pretty text-base leading-relaxed">
              {data.whatsapp
                ? "No products yet. Check back soon — or message the seller on WhatsApp."
                : "No products yet. Check back soon."}
            </p>
          </div>
        ) : (
          // Pinterest-style pins: masonry, image-first. Tapping a pin
          // opens its details (all photos, full description, WhatsApp
          // order) — there is no order button on the pin itself.
          // In the compact dashboard preview the frame is only 300px
          // wide, so it always stays 2 columns like a real phone;
          // the live page widens to 3/4 columns on bigger screens.
          <div className={`mt-8 w-full columns-2 gap-4 ${compact ? "" : "sm:columns-3 lg:columns-4"}`}>
            {items.map((l) => (
              <CatalogueCard key={l.id} item={l} whatsapp={data.whatsapp} shopName={name} pageUrl={origin ? `${origin}/${data.username ?? ""}` : `/${data.username ?? ""}`} onLinkClick={onLinkClick} onProductView={onProductView} demoMode={demoMode} />
            ))}
          </div>
        )}

        {(showBranding || (reportable && data.username)) && (
          <div className="mx-auto mt-14 flex w-full flex-col items-center gap-2 border-t border-page-border pt-6">
            {showBranding && (
              <a href="/" className="flex min-h-[44px] items-center text-base font-semibold text-page-muted transition hover:text-page-fg">Made with Izzy</a>
            )}
            {/* Live pages only (the dashboard preview passes no
                `reportable`): a discreet way for visitors to flag a
                shop for the admin team to review. */}
            {reportable && data.username && <ReportShopButton username={data.username} />}
          </div>
        )}
      </div>
      {/* Floating WhatsApp button, live pages only: shown whenever the
          seller set a number (the component returns null otherwise).
          Compact previews and mockups are static illustrations, so
          this fixed button is skipped there. */}
      {!compact && (
        <FloatingWhatsAppButton whatsapp={data.whatsapp} floating="fixed" />
      )}
    </div>
  );
}
