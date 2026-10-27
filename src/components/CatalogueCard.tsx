import { useState } from "react";
import { MessageCircle, ShoppingBag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { waCardLink } from "@/lib/themes";

export type CatalogueItem = { id: string; title: string; kind?: string; price?: string | null; description?: string | null; image_urls?: string[]; category?: string | null };

export function CatalogueCard({ item, whatsapp, pageUrl, onLinkClick }: {
  item: CatalogueItem; whatsapp: string | null; pageUrl: string; onLinkClick?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const photos = item.image_urls ?? [];
  const service = item.kind === "service";
  const Icon = service ? Briefcase : ShoppingBag;
  const href = whatsapp && /\d{6,}/.test(whatsapp.replace(/\D/g, "")) ? waCardLink(whatsapp, item.kind ?? "product", item.title, `${pageUrl}#item-${item.id}`) : null;
  const [open, setOpen] = useState(false);
  const action = href ? <Button asChild className="min-h-[48px] w-full rounded-full bg-page-fg text-base text-page-bg hover:bg-page-fg/90"><a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(item.id)}><MessageCircle />{service ? "Book on WhatsApp" : "Order on WhatsApp"}</a></Button> : null;
  // Simple ecom card: ONE uniform square image for every product, so the
  // grid lines up evenly. (No more varied Pinterest aspect ratios.)
  return <article id={`item-${item.id}`} className="overflow-hidden rounded-[24px] border border-page-border bg-page-btn text-page-btn-fg shadow-pin">
    <Button variant="ghost" className="block h-auto w-full whitespace-normal rounded-none p-0 text-left hover:bg-page-btn" onClick={() => setOpen(true)} aria-label={`View ${item.title}`}>
      {photos[0] ? <img src={photos[0]} alt={item.title} loading="lazy" className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-page-bg"><Icon className="h-12 w-12 text-page-muted" /></div>}
      <div className="space-y-1.5 p-4">
        <h3 className="break-words text-base font-semibold leading-snug">{item.title}</h3>
        {item.price && <p className="break-words text-base font-bold">{item.price}</p>}
        {item.description && <p className="line-clamp-2 break-words text-sm font-normal leading-relaxed text-page-muted">{item.description}</p>}
        <p className="pt-1 text-sm font-medium text-page-muted">See details →</p>
      </div>
    </Button>
    {/* No order button on the pin itself: tapping the pin opens the
        details below, and ordering happens from there only. */}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="break-words pr-5">{item.title}</DialogTitle></DialogHeader>
        {photos.length > 0 && <div className="space-y-2">
          <img src={photos[selected] || photos[0]} alt={item.title} className="aspect-[4/3] w-full rounded-lg bg-muted object-contain" />
          {photos.length > 1 && <div className="flex gap-2">{photos.map((photo, i) => <Button key={photo} variant="outline" className={`h-16 w-16 shrink-0 overflow-hidden p-0 ${selected === i ? "ring-2 ring-ring" : ""}`} aria-label={`Show photo ${i + 1}`} onClick={() => setSelected(i)}><img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" /></Button>)}</div>}
        </div>}
        {item.category && <p className="text-sm text-muted-foreground">{item.category}</p>}
        {item.price && <p className="break-words text-xl font-bold">{item.price}</p>}
        {item.description && <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{item.description}</p>}
        <div className="flex flex-col gap-2">
          {action}
          <Button variant="outline" className="min-h-[48px] w-full rounded-full text-base" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  </article>;
}