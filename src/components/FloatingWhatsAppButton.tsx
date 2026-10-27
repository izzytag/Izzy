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
 * - Dashboard preview: absolute inside the phone frame, so it never
 *   floats over the whole dashboard.
 */
export function FloatingWhatsAppButton({ whatsapp, floating }: {
  whatsapp: string | null;
  floating: "fixed" | "absolute";
}) {
  if (!whatsapp) return null;
  const position = floating === "absolute" ? "absolute bottom-4 right-4 z-40" : "fixed bottom-4 right-4 z-40";
  return (
    <a
      href={waLink(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pin transition hover:scale-105 ${position}`}
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
