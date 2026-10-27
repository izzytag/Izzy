import { useEffect, useState } from "react";
import { Instagram, Youtube, Twitter, Linkedin, MessageCircle, IndianRupee, Link as LinkIcon, ShoppingBag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isCompleteSocial, socialUrl, upiLink, waCardLink, waLink, type ThemeId } from "@/lib/themes";

const ICONS: Record<string, typeof Instagram> = { instagram: Instagram, youtube: Youtube, x: Twitter, linkedin: Linkedin, whatsapp: MessageCircle };

export type PublicData = {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  socials: Record<string, string>;
  whatsapp: string | null;
  upi_id: string | null;
  links: { id: string; title: string; url: string; kind?: string; price?: string | null; description?: string | null }[];
};

export function PublicProfile({ data, theme, showBranding, onLinkClick, compact, shopHref }: {
  data: PublicData; theme: ThemeId; showBranding: boolean; onLinkClick?: (id: string) => void; compact?: boolean;
  /** Set only when the seller has enabled products — shows one clear "Visit my Shop" button. */
  shopHref?: string | null;
}) {
  const [showUpi, setShowUpi] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const name = data.display_name || data.username || "";
  const socials = Object.entries(data.socials || {}).filter(([k, v]) => isCompleteSocial(k, v));
  const btn = "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-page-border bg-page-btn px-5 py-3.5 text-base text-center font-semibold text-page-btn-fg transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]";

  return (
    <div className={`theme-${theme} bg-page-bg text-page-fg ${compact ? "min-h-full" : "min-h-screen"}`}>
      <div className={`mx-auto flex w-full max-w-md flex-col items-center px-5 ${compact ? "py-8" : "py-10"}`}>
        {data.avatar_url ? (
          <img src={data.avatar_url} alt={name} className="h-28 w-28 rounded-full border-4 border-page-border object-cover" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-page-btn text-4xl font-bold text-page-btn-fg">{name.charAt(0).toUpperCase() || "?"}</div>
        )}
        <h1 className="mt-4 text-center text-3xl font-bold leading-tight">{name}</h1>
        {data.username && <p className="text-base text-page-muted">@{data.username}</p>}
        {data.bio && <p className="mt-3 text-center text-base leading-relaxed text-page-muted">{data.bio}</p>}

        {socials.length > 0 && (
          <div className="mt-5 flex gap-3">
            {socials.map(([k, v]) => {
              const Icon = ICONS[k] ?? LinkIcon;
              return (
                <a key={k} href={socialUrl(k, v)} target="_blank" rel="noopener noreferrer" aria-label={k} className="flex h-11 w-11 items-center justify-center rounded-full border border-page-border text-page-fg transition hover:scale-110">
                  <Icon className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex w-full flex-col gap-3">
          {data.whatsapp && (
            <a href={waLink(data.whatsapp)} target="_blank" rel="noopener noreferrer" className={btn}>
              <MessageCircle className="h-5 w-5" /> WhatsApp me
            </a>
          )}
          {shopHref && (
            <a href={shopHref} className={btn}>
              <ShoppingBag className="h-5 w-5" /> Visit my Shop →
            </a>
          )}
          {data.links.map((l) => {
            const kind = l.kind ?? "link";
            if (kind === "link") {
              return (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(l.id)} className={btn}>
                  {l.title}
                </a>
              );
            }
            const pageUrl = `${origin}/${data.username ?? ""}`;
            const href = data.whatsapp ? waCardLink(data.whatsapp, kind, l.title, pageUrl) : null;
            return (
              <div key={l.id} className="rounded-3xl border border-page-border bg-page-btn p-5 text-page-btn-fg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-page-muted">{kind === "service" ? "Service" : "Product"}</p>
                    <p className="text-lg font-semibold leading-snug">{l.title}</p>
                  </div>
                  {l.price && <p className="shrink-0 text-lg font-bold">{l.price}</p>}
                </div>
                {l.description && <p className="mt-2 text-base leading-relaxed text-page-muted">{l.description}</p>}
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(l.id)}
                    className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-page-fg px-4 py-3 text-base font-semibold text-page-bg">
                    <MessageCircle className="h-4 w-4" /> {kind === "service" ? "Book on WhatsApp" : "Order on WhatsApp"}
                  </a>
                )}
              </div>
            );
          })}
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
          {data.links.length === 0 && !data.whatsapp && !data.upi_id && (
            <p className="text-center text-base text-page-muted">Nothing here yet.</p>
          )}
        </div>

        {showBranding && (
          <a href="/" className="mt-12 flex min-h-[44px] items-center text-base font-semibold text-page-muted hover:text-page-fg">Made with Izzy</a>
        )}
      </div>
    </div>
  );
}
