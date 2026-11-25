import { useState } from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOrderTotal, waOrderLink, type OrderFulfilment } from "@/lib/themes";
import type { CatalogueItem } from "@/components/CatalogueCard";

/** Today's date as YYYY-MM-DD in local time, for the date input's minimum. */
function todayIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

const inputClass = "min-h-[44px] w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

/**
 * Short order form shown inside the product dialog before WhatsApp
 * opens. The buyer adds quantity, date needed, pickup or delivery
 * (+ address) and an optional note; WhatsApp then opens with the
 * complete order message, not an "I'm interested, tell me more".
 * Rendered only on real shop pages — the demo shop never reaches
 * this component (its order action routes to signup instead).
 */
export function OrderForm({ item, whatsapp, shopName, pageUrl, onLinkClick, onBack }: {
  item: CatalogueItem;
  whatsapp: string;
  shopName?: string | null | undefined;
  pageUrl: string;
  onLinkClick?: ((id: string) => void) | undefined;
  onBack: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [dateNeeded, setDateNeeded] = useState("");
  const [fulfilment, setFulfilment] = useState<OrderFulfilment>("pickup");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const needsAddress = fulfilment === "delivery";
  const missing = !dateNeeded ? "Add the date you need it by." : needsAddress && !address.trim() ? "Add the delivery address." : null;
  const total = formatOrderTotal(item.price, quantity);
  const href = !missing
    ? waOrderLink(whatsapp, item.title, pageUrl, { quantity, dateNeeded, fulfilment, address, note }, { price: item.price, shopName })
    : null;

  const fulfilmentButton = (value: OrderFulfilment, label: string) => (
    <Button
      key={value}
      type="button"
      variant={fulfilment === value ? "default" : "outline"}
      aria-pressed={fulfilment === value}
      className="min-h-[44px] flex-1 rounded-full text-base font-semibold"
      onClick={() => setFulfilment(value)}
    >
      {label}
    </Button>
  );

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold leading-tight">Complete your order</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">Add the order details. WhatsApp opens with the full message ready to send.</p>
      </div>

      <p className="break-words text-base leading-relaxed">
        <span className="font-semibold">{item.title}</span>
        {item.price && <span className="text-muted-foreground"> · {item.price} each</span>}
      </p>

      <div className="space-y-2">
        <span id="order-quantity-label" className="block text-sm font-semibold">Quantity</span>
        <div className="flex items-center gap-3" role="group" aria-labelledby="order-quantity-label">
          <Button
            type="button"
            variant="outline"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            className="min-h-[44px] min-w-[44px] rounded-full p-0"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span aria-live="polite" className="min-w-8 text-center text-lg font-bold">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            aria-label="Increase quantity"
            disabled={quantity >= 99}
            className="min-h-[44px] min-w-[44px] rounded-full p-0"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          >
            <Plus className="h-5 w-5" />
          </Button>
          {total && <p className="ml-auto break-words text-base font-bold">Total: {total}{quantity > 1 && item.price ? ` (${quantity} × ${item.price.trim()})` : ""}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="order-date" className="block text-sm font-semibold">Date needed</label>
        <input
          id="order-date"
          type="date"
          min={todayIso()}
          value={dateNeeded}
          onChange={(e) => setDateNeeded(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <span id="order-fulfilment-label" className="block text-sm font-semibold">Pickup or delivery</span>
        <div className="flex gap-2" role="group" aria-labelledby="order-fulfilment-label">
          {fulfilmentButton("pickup", "Pickup")}
          {fulfilmentButton("delivery", "Delivery")}
        </div>
      </div>

      {needsAddress && (
        <div className="space-y-2">
          <label htmlFor="order-address" className="block text-sm font-semibold">Delivery address</label>
          <textarea
            id="order-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat, street, area, city"
            className={`${inputClass} resize-none py-2.5`}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="order-note" className="block text-sm font-semibold">Note for the seller <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input
          id="order-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything the seller should know"
          className={inputClass}
        />
      </div>

      <div className="space-y-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {href ? (
          <Button asChild className="min-h-[52px] w-full rounded-full bg-whatsapp text-[17px] font-semibold text-whatsapp-foreground shadow-sm hover:bg-whatsapp/90">
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.(item.id)}>
              <MessageCircle />{"Send order on WhatsApp"}
            </a>
          </Button>
        ) : (
          <Button type="button" disabled className="min-h-[52px] w-full rounded-full bg-whatsapp text-[17px] font-semibold text-whatsapp-foreground opacity-50">
            <MessageCircle />{"Send order on WhatsApp"}
          </Button>
        )}
        {missing && <p className="text-center text-sm leading-relaxed text-muted-foreground">{missing}</p>}
        <Button type="button" variant="outline" className="min-h-[52px] w-full rounded-full text-base" onClick={onBack}>Back to product</Button>
      </div>
    </form>
  );
}
