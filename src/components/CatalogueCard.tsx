import { useState } from "react";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { waCardLink } from "@/lib/themes";
import { OrderForm } from "@/components/OrderForm";

export type CatalogueItem = { id: string; title: string; kind?: string; price?: string | null; description?: string | null; image_urls?: string[]; category?: string | null; option_label?: string | null; options?: string[] };

export function CatalogueCard({ item, whatsapp, shopName, pageUrl, onLinkClick, onProductView, demoMode, interactive = true }: {
  item: CatalogueItem; whatsapp: string | null; shopName?: string | null; pageUrl: string; onLinkClick?: (id: string) => void; onProductView?: ((id: string) => void) | undefined; demoMode?: boolean | undefined;
  /** Dashboard preview frames are static illustrations: pins do not open the full-screen product dialog (which would zoom over the dashboard and hide its bottom navigation). Live shops keep the dialog + order form exactly as before. */
  interactive?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [pinImgFailed, setPinImgFailed] = useState(false);
  const [detailImgFailed, setDetailImgFailed] = useState(false);
  const photos = item.image_urls ?? [];
  const Icon = ShoppingBag;
  const href = whatsapp && /\d{6,}/.test(whatsapp.replace(/\D/g, "")) ? waCardLink(whatsapp, item.kind ?? "product", item.title, `${pageUrl}#item-${item.id}`, { price: item.price, shopName }) : null;
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const productOptions = (item.options ?? []).filter((o) => o.trim());
  const optionLabel = item.option_label?.trim() || "Option";
  // Ordering happens in two steps: the buyer first completes the
  // short order form (quantity, date, pickup/delivery, note), and
  // only then does WhatsApp open — with the complete order message.
  // The form is cleared whenever the dialog closes, so reopening a
  // product always starts from the product details.
  const [ordering, setOrdering] = useState(false);
  // Demo mode (the /demo example shop): there is no seller and no
  // WhatsApp number, so the order action is replaced by a signup
  // call to action — a visitor can never message a wrong number or
  // mistake the demo for a real shop. Live shops are unaffected.
  const demoAction = (
    <div className="space-y-2.5">
      <p className="text-center text-sm leading-relaxed text-muted-foreground">This is a demo shop. On your own shop, this button opens WhatsApp with the order message ready.</p>
      <Button asChild className="min-h-[52px] w-full rounded-full text-[17px] font-semibold"><a href="/auth">Create your own shop</a></Button>
    </div>
  );
  // The dialog renders in a portal outside the `.theme-*` wrapper, so
  // it must use the app-level tokens (defined on :root) — the
  // page-* theme variables do not resolve there. WhatsApp green is
  // the designated colour for WhatsApp actions. The order button
  // opens the order form instead of WhatsApp directly; the form's
  // send button is what opens WhatsApp (and records the click).
  const action = demoMode ? demoAction : href ? <Button className="min-h-[52px] w-full rounded-full bg-whatsapp text-[17px] font-semibold text-whatsapp-foreground shadow-sm hover:bg-whatsapp/90" onClick={() => setOrdering(true)}><MessageCircle />{"Order on WhatsApp"}</Button> : null;
  const pinBody = (<>
      {photos[0] && !pinImgFailed ? <div className="min-h-[120px] bg-page-bg"><img src={photos[0]} alt={item.title} loading="lazy" decoding="async" onError={() => setPinImgFailed(true)} className="h-auto max-h-[480px] w-full bg-page-bg object-cover" /></div> : <div className="flex aspect-[4/5] items-center justify-center bg-page-bg"><Icon className="h-12 w-12 text-page-muted" /></div>}
      <div className="space-y-1 p-3.5 sm:p-4">
        <h3 className="break-words text-[15px] font-semibold leading-snug">{item.title}</h3>
        {item.price && <p className="break-words text-[17px] font-bold tracking-tight">{item.price}</p>}
        {item.description && <p className="line-clamp-2 break-words pt-0.5 text-sm font-normal leading-relaxed text-page-card-muted">{item.description}</p>}
      </div>
    </>);
  if (!interactive) {
    return <article id={`item-${item.id}`} className="mb-4 break-inside-avoid overflow-hidden rounded-[24px] border border-page-border bg-page-btn text-page-btn-fg shadow-pin">{pinBody}</article>;
  }
  return <article id={`item-${item.id}`} className="mb-4 break-inside-avoid overflow-hidden rounded-[24px] border border-page-border bg-page-btn text-page-btn-fg shadow-pin">
    <Button variant="ghost" className="block h-auto w-full touch-manipulation whitespace-normal rounded-none p-0 text-left transition-transform duration-150 hover:bg-page-btn hover:text-page-btn-fg active:scale-[0.99]" onClick={() => { setOpen(true); onProductView?.(item.id); }} aria-label={`View ${item.title}`}>
      {pinBody}
    </Button>
    {/* No order button on the pin itself: tapping the pin opens the
        details below, and ordering happens from there only. */}
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setOrdering(false); setSelectedOption(""); } }}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-2rem)] gap-5 overflow-y-auto rounded-2xl sm:max-w-lg sm:rounded-2xl">
        <DialogHeader className="text-left"><DialogTitle className="break-words pr-8 text-left text-[22px] font-bold leading-tight tracking-tight">{item.title}</DialogTitle></DialogHeader>
        {ordering && !demoMode && href ? (
          <OrderForm item={item} whatsapp={whatsapp ?? ""} shopName={shopName} pageUrl={pageUrl} onLinkClick={onLinkClick} onBack={() => setOrdering(false)} selectedOption={selectedOption} onSelectedOption={setSelectedOption} />
        ) : (
          <>
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
        {productOptions.length > 0 && !demoMode && (
          <div className="space-y-2">
            <span className="block text-sm font-semibold">{optionLabel}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={optionLabel}>
              {productOptions.map((choice) => (
                <button key={choice} type="button" aria-pressed={selectedOption === choice} onClick={() => setSelectedOption(choice)}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition ${selectedOption === choice ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* The action block sticks to the bottom of the scrolling
            dialog, so ordering never requires scrolling past a long
            description or photo list. It bleeds to the dialog edges
            with a solid background and top border, and its bottom
            padding respects the phone's safe area. While the order
            form is open the form carries its own send/back actions,
            so this block is hidden. */}
        <div className="sticky bottom-0 z-10 -mx-6 flex flex-col gap-2 border-t border-border bg-background px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          {action ?? (
            <p className="flex min-h-[52px] items-center justify-center rounded-2xl bg-muted px-4 py-3 text-center text-sm leading-relaxed text-muted-foreground">
              This shop hasn&apos;t added WhatsApp ordering yet.
            </p>
          )}
          <Button variant="outline" className="min-h-[52px] w-full rounded-full text-base" onClick={() => setOpen(false)}>Close</Button>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  </article>;
}