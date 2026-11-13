import { type CSSProperties } from "react";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/themes";

/**
 * Floating WhatsApp button for store pages only. It replaces the old
 * standalone "WhatsApp me" pill that sat in the page flow.
 *
 * - Shown only when the seller has a WhatsApp number set.
 * - Generic chat link (waLink) — the product-specific prefilled message
 *   stays only inside the product details dialog (waCardLink).
 * - Green circle, white chat icon (lucide MessageCircle — not the
 *   official WhatsApp logo asset), soft shadow, bottom-right.
 * - Live pages: fixed to the viewport, z-40 so it sits BELOW the
 *   product details dialog (z-50) and never covers its buttons.
 *   Its offset respects the phone's safe area (home indicator,
 *   gesture bar) so it never sits awkwardly on small screens.
 * - Dashboard preview: absolute inside the phone frame, so it never
 *   floats over the whole dashboard.
 */
export function FloatingWhatsAppButton({ whatsapp, floating }: {
  whatsapp: string | null;
  floating: "fixed" | "absolute";
}) {
  if (!whatsapp) return null;
  const style: CSSProperties = { backgroundColor: "#25D366" };
  let position: string;
  if (floating === "absolute") {
    position = "absolute bottom-4 right-4 z-40";
  } else {
    position = "fixed z-40";
    style.bottom = "max(1rem, env(safe-area-inset-bottom))";
    style.right = "max(1rem, env(safe-area-inset-right))";
  }
  return (
    <a
      href={waLink(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pin transition hover:scale-105 active:scale-95 ${position}`}
      style={style}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
