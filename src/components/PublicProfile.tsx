import { useEffect, useState } from "react";
import { Instagram, Youtube, Twitter, Linkedin, MessageCircle, IndianRupee, Link as LinkIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isCompleteSocial, socialUrl, upiLink, type ThemeId } from "@/lib/themes";
import { getPageMode, visiblePageItems } from "@/lib/page-mode";
import { CatalogueCard } from "@/components/CatalogueCard";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

const ICONS: Record<string, typeof Instagram> = { instagram: Instagram, youtube: Youtube, x: Twitter, linkedin: Linkedin, whatsapp: MessageCircle };

export type PublicData = {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  socials: Record<string, string>;
  whatsapp: string | null;
  upi_id: string | null;
  links: { id: string; title: string; url: string; kind?: string; price?: string | null; description?: string | null; image_urls?: string[]; category?: string | null }[];
};

export function PublicProfile({ data, theme, showBranding, onLinkClick, compact }: {
  data: PublicData; theme: ThemeId; showBranding: boolean; onLinkClick?: (id: string) => void; compact?: boolean;
  // No shop navigation button here: the live main page never links to
  // /shop (products already show inline in shop mode), and the dashboard
  // preview switches views from its own chrome toggle above the frame.
}) {
  const [showUpi, setShowUpi] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const name = data.display_name || data.username || "";
  const socials = Object.entries(data.socials || {}).filter(([k, v]) => isCompleteSocial(k, v));
  // Exclusive page modes: a visitor sees either links OR products/services,
  // never a mix. Legacy links on a store/service page are hidden, not deleted.
  const visibleLinks = visiblePageItems(data.links);
  const shopMode = getPageMode(data.links) === "shop";
  const linkItems = visibleLinks.filter((l) => (l.kind ?? "link") === "link");
  const productItems = visibleLinks.filter((l) => l.kind === "product" || l.kind === "service");
  const btn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 py-3.5 text-center text-base font-semibold text-page-btn-fg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";

  return (
    <div className={`theme-${theme} bg-page-bg text-page-fg ${compact ? "min-h-full" : "min-h-screen"}`}>
      <div className={`mx-auto flex w-full ${shopMode ? "max-w-5xl" : "max-w-[420px]"} flex-col items-center px-4 ${compact ? "py-8" : "py-12"}`}>
        {shopMode ? (
          // Store header: logo beside the store name, at the top.
          // No @username here — the username stays in the URL only.
          <div className="flex w-full items-start gap-4">
            {data.avatar_url ? (
              <img src={data.avatar_url} alt={name} className="h-16 w-16 shrink-0 rounded-full object-cover shadow-pin ring-4 ring-white/70" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-page-btn text-2xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70">{name.charAt(0).toUpperCase() || "?"}</div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{name}</h1>
              {data.bio && <p className="mt-1 text-base leading-relaxed text-page-muted sm:text-[17px]">{data.bio}</p>}
            </div>
          </div>
        ) : (
          <>
            {data.avatar_url ? (
              <img src={data.avatar_url} alt={name} className="h-[120px] w-[120px] rounded-full object-cover shadow-pin ring-4 ring-white/70" />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-page-btn text-4xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70">{name.charAt(0).toUpperCase() || "?"}</div>
            )}
            <h1 className="mt-5 text-center text-[32px] font-bold leading-tight">{name}</h1>
            {data.username && <p className="text-base text-page-muted">@{data.username}</p>}
            {data.bio && <p className="mt-2 text-center text-[17px] leading-relaxed text-page-muted">{data.bio}</p>}
          </>
        )}

        {socials.length > 0 && (
          <div className={`mt-5 flex gap-3 ${shopMode ? "self-start" : ""}`}>
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

        <div className={`mt-8 flex w-full flex-col gap-3.5 ${shopMode ? "sm:max-w-[420px] sm:self-start" : ""}`}>
          {linkItems.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(l.id)} className={btn}>
              {l.title}
            </a>
          ))}
          {data.upi_id && (
            <>
              <button type="button" onClick={() => setShowUpi((s) => !s)} className={btn}>
                <IndianRupee className="h-5 w-5" /> Pay via UPI
              </button>
              {showUpi && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-page-border bg-page-btn p-5 text-page-btn-fg">
                  <div className="rounded-xl bg-card p-3"><QRCodeSVG value={upiLink(data.upi_id, name)} size={168} /></div>
                  <p className="text-sm font-medium">{data.upi_id}</p>
                  <p className="text-xs text-page-muted">Buyers enter the amount themselves in their UPI app.</p>
                  <a href={upiLink(data.upi_id, name)} className="w-full rounded-xl bg-page-fg px-4 py-3 text-center text-sm font-semibold text-page-bg">Tap to pay with UPI app</a>
                </div>
              )}
            </>
          )}
          {visibleLinks.length === 0 && !data.upi_id && (
            <p className="text-center text-base text-page-muted">Nothing here yet.</p>
          )}
        </div>

        {productItems.length > 0 && (
          // Pinterest-style pins: masonry, image-first. Tapping a pin
          // opens its details (all photos, full description, WhatsApp
          // order) — there is no order button on the pin itself.
          // In the compact dashboard preview the frame is only 300px
          // wide, so it always stays 2 columns like a real phone;
          // the live page widens to 3/4 columns on bigger screens.
          <div className={`mt-8 w-full columns-2 gap-4 ${compact ? "" : "sm:columns-3 lg:columns-4"}`}>
            {productItems.map((l) => (
              <CatalogueCard key={l.id} item={l} whatsapp={data.whatsapp} pageUrl={origin ? `${origin}/${data.username ?? ""}` : `/${data.username ?? ""}`} onLinkClick={onLinkClick} />
            ))}
          </div>
        )}

        {showBranding && (
          <a href="/" className="mt-12 flex min-h-[44px] items-center text-base font-semibold text-page-muted hover:text-page-fg">Made with Izzy</a>
        )}
      </div>
      {/* Floating WhatsApp button, live pages only, store pages only:
          shop mode + a WhatsApp number set. In the dashboard preview
          (compact) PhonePreview renders its own absolute version inside
          the phone frame, so this fixed one is skipped there. Links-mode
          pages get no floating button — a link page is not a store page. */}
      {shopMode && !compact && (
        <FloatingWhatsAppButton whatsapp={data.whatsapp} floating="fixed" />
      )}
    </div>
  );
}
