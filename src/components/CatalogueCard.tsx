import { useState } from "react";
import { MessageCircle, ShoppingBag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { waCardLink } from "@/lib/themes";

export type CatalogueItem = { id: string; title: string; kind?: string; price?: string | null; description?: string | null; image_urls?: string[]; category?: string | null };

export function CatalogueCard({ item, whatsapp, shopName, pageUrl, onLinkClick, onProductView }: {
  item: CatalogueItem; whatsapp: string | null; shopName?: string | null; pageUrl: string; onLinkClick?: (id: string) => void; onProductView?: ((id: string) => void) | undefined;
}) {
  const [selected, setSelected] = useState(0);
  const [pinImgFailed, setPinImgFailed] = useState(false);
  const [detailImgFailed, setDetailImgFailed] = useState(false);
  const photos = item.image_urls ?? [];
  const service = item.kind === "service";
  const Icon = service ? Briefcase : ShoppingBag;
  const href = whatsapp && /\d{6,}/.test(whatsapp.replace(/\D/g, "")) ? waCardLink(whatsapp, item.kind ?? "product", item.title, `${pageUrl}#item-${item.id}`, { price: item.price, shopName }) : null;
  const [open, setOpen] = useState(false);
  // The dialog renders in a portal outside the `.theme-*` wrapper, so
  // it must use the app-level tokens (defined on :root) — the
  // page-* theme variables do not resolve there. WhatsApp green is
  // the designated colour for WhatsApp actions.
  const action = href ? <Button asChild className="min-h-[52px] w-full rounded-full bg-whatsapp text-[17px] font-semibold text-whatsapp-foreground shadow-sm hover:bg-whatsapp/90"><a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(item.id)}><MessageCircle />{service ? "Book on WhatsApp" : "Order on WhatsApp"}</a></Button> : null;
  return <article id={`item-${item.id}`} className="mb-4 break-inside-avoid overflow-hidden rounded-[24px] border border-page-border bg-page-btn text-page-btn-fg shadow-pin">
    <Button variant="ghost" className="block h-auto w-full whitespace-normal rounded-none p-0 text-left transition-transform duration-150 hover:bg-page-btn active:scale-[0.99]" onClick={() => { setOpen(true); onProductView?.(item.id); }} aria-label={`View ${item.title}`}>
      {/* Pins show the photo at its natural ratio (capped, so an
          extreme panorama or portrait can't dominate the column) —
          no stretching, and no routine cropping of faces. The
          masonry columns absorb the varied heights. */}
      {photos[0] && !pinImgFailed ? <img src={photos[0]} alt={item.title} loading="lazy" onError={() => setPinImgFailed(true)} className="h-auto max-h-[480px] w-full bg-page-bg object-cover" /> : <div className="flex aspect-[4/5] items-center justify-center bg-page-bg"><Icon className="h-12 w-12 text-page-muted" /></div>}
      <div className="space-y-1 p-3.5 sm:p-4">
        <h3 className="break-words text-[15px] font-semibold leading-snug">{item.title}</h3>
        {item.price && <p className="break-words text-[17px] font-bold tracking-tight">{item.price}</p>}
        {item.description && <p className="line-clamp-2 break-words pt-0.5 text-sm font-normal leading-relaxed text-page-muted">{item.description}</p>}
        <p className="pt-1.5 text-sm font-medium text-page-muted">See details →</p>
      </div>
    </Button>
    {/* No order button on the pin itself: tapping the pin opens the
        details below, and ordering happens from there only. */}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-2rem)] gap-5 overflow-y-auto rounded-2xl sm:max-w-lg sm:rounded-2xl">
        <DialogHeader className="text-left"><DialogTitle className="break-words pr-8 text-left text-[22px] font-bold leading-tight tracking-tight">{item.title}</DialogTitle></DialogHeader>
        {photos.length > 0 ? <div className="space-y-2.5">
          {detailImgFailed ? (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-muted"><Icon className="h-12 w-12 text-muted-foreground" /></div>
          ) : (
            <img src={photos[selected] || photos[0]} alt={item.title} onError={() => setDetailImgFailed(true)} className="aspect-[4/3] max-h-[46dvh] w-full rounded-xl bg-muted object-contain" />
          )}
          {photos.length > 1 && <div className="flex gap-2">{photos.map((photo, i) => <Button key={photo} variant="outline" className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg p-0 ${selected === i ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} aria-label={`Show photo ${i + 1}`} onClick={() => { setSelected(i); setDetailImgFailed(false); }}><img src={photo} alt={`Photo ${i + 1}`} onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover" /></Button>)}</div>}
        </div> : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-muted"><Icon className="h-12 w-12 text-muted-foreground" /></div>
        )}
        <div className="space-y-2">
          {item.category && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.category}</p>}
          {item.price && <p className="break-words text-[22px] font-bold tracking-tight">{item.price}</p>}
          {item.description && <p className="whitespace-pre-wrap break-words text-pretty text-base leading-relaxed">{item.description}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {action ?? (
            <p className="flex min-h-[52px] items-center justify-center rounded-2xl bg-muted px-4 py-3 text-center text-sm leading-relaxed text-muted-foreground">
              This shop hasn&apos;t added WhatsApp ordering yet.
            </p>
          )}
          <Button variant="outline" className="min-h-[52px] w-full rounded-full text-base" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  </article>;
}