import { useEffect, useState } from "react";
import { Instagram, Youtube, Twitter, Linkedin, MessageCircle, IndianRupee, Link as LinkIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isCompleteSocial, socialUrl, upiLink, type ThemeId } from "@/lib/themes";
import { CatalogueCard } from "@/components/CatalogueCard";
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
export function PublicProfile({ data, theme, showBranding, onLinkClick, compact }: {
  data: PublicData; theme: ThemeId; showBranding: boolean; onLinkClick?: (id: string) => void; compact?: boolean;
}) {
  const [showUpi, setShowUpi] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const name = data.display_name || data.username || "";
  const socials = Object.entries(data.socials || {}).filter(([k, v]) => isCompleteSocial(k, v));
  const items = data.links.filter((l) => l.kind === "product" || l.kind === "service");
  const btn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 py-3.5 text-center text-base font-semibold text-page-btn-fg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";

  return (
    <div className={`theme-${theme} bg-page-bg text-page-fg ${compact ? "min-h-full" : "min-h-screen"}`}>
      <div className={`mx-auto flex w-full max-w-5xl flex-col px-4 ${compact ? "py-8" : "py-10 sm:px-5"}`}>
        {/* Store header: logo beside the store name, at the top.
            No @username here — the username stays in the URL only. */}
        <div className="flex w-full items-start gap-4">
          {data.avatar_url && !avatarFailed ? (
            <img src={data.avatar_url} alt={name} onError={() => setAvatarFailed(true)} className="h-16 w-16 shrink-0 rounded-full object-cover shadow-pin ring-4 ring-white/70" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-page-btn text-2xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70">{name.charAt(0).toUpperCase() || "?"}</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{name}</h1>
            {data.category && <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-page-muted">{data.category}</p>}
            {data.bio && <p className="mt-1 text-base leading-relaxed text-page-muted sm:text-[17px]">{data.bio}</p>}
          </div>
        </div>

        {socials.length > 0 && (
          <div className="mt-5 flex gap-3 self-start">
            {socials.map(([k, v]) => {
              const Icon = ICONS[k] ?? LinkIcon;
              return (
                <a key={k} href={socialUrl(k, v)} target="_blank" rel="noopener noreferrer" aria-label={k} className="flex h-11 w-11 items-center justify-center rounded-full border border-page-border bg-page-btn text-page-fg shadow-sm transition hover:scale-110">
                  <Icon className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        )}

        {data.upi_id && (
          <div className="mt-8 w-full sm:max-w-[420px]">
            <button type="button" onClick={() => setShowUpi((s) => !s)} className={btn}>
              <IndianRupee className="h-5 w-5" /> Pay via UPI
            </button>
            {showUpi && (
              <div className="mt-3.5 flex flex-col items-center gap-3 rounded-2xl border border-page-border bg-page-btn p-5 text-page-btn-fg">
                <div className="rounded-xl bg-card p-3"><QRCodeSVG value={upiLink(data.upi_id, name)} size={168} /></div>
                <p className="text-sm font-medium">{data.upi_id}</p>
                <p className="text-xs text-page-muted">Buyers enter the amount themselves in their UPI app.</p>
                <a href={upiLink(data.upi_id, name)} className="w-full rounded-xl bg-page-fg px-4 py-3 text-center text-sm font-semibold text-page-bg">Tap to pay with UPI app</a>
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p className="mx-auto mt-8 w-full max-w-[420px] rounded-[28px] border border-page-border bg-page-btn p-6 text-center text-base text-page-btn-fg shadow-sm">
            {data.whatsapp
              ? "No products yet. Check back soon — or message the seller on WhatsApp."
              : "No products yet. Check back soon."}
          </p>
        ) : (
          // Pinterest-style pins: masonry, image-first. Tapping a pin
          // opens its details (all photos, full description, WhatsApp
          // order) — there is no order button on the pin itself.
          // In the compact dashboard preview the frame is only 300px
          // wide, so it always stays 2 columns like a real phone;
          // the live page widens to 3/4 columns on bigger screens.
          <div className={`mt-8 w-full columns-2 gap-4 ${compact ? "" : "sm:columns-3 lg:columns-4"}`}>
            {items.map((l) => (
              <CatalogueCard key={l.id} item={l} whatsapp={data.whatsapp} shopName={name} pageUrl={origin ? `${origin}/${data.username ?? ""}` : `/${data.username ?? ""}`} onLinkClick={onLinkClick} />
            ))}
          </div>
        )}

        {showBranding && (
          <a href="/" className="mx-auto mt-12 flex min-h-[44px] items-center text-base font-semibold text-page-muted hover:text-page-fg">Made with Izzy</a>
        )}
      </div>
      {/* Floating WhatsApp button, live pages only: shown whenever the
          seller set a number (the component returns null otherwise).
          In the dashboard preview (compact) PhonePreview renders its
          own absolute version inside the phone frame, so this fixed
          one is skipped there. */}
      {!compact && (
        <FloatingWhatsAppButton whatsapp={data.whatsapp} floating="fixed" />
      )}
    </div>
  );
}
