import { PublicProfile, type PublicData } from "./PublicProfile";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";
import { type ThemeId } from "@/lib/themes";

/**
 * Preview: a phone frame around the seller's real storefront — the
 * shop page is the only public page, so there is no view switching.
 * The frame shows exactly what visitors see: store header, catalogue,
 * and the floating WhatsApp button pinned INSIDE the frame (absolute)
 * when a number is set, never fixed to the dashboard viewport.
 */
export function PhonePreview(props: { data: PublicData; theme: ThemeId; showBranding: boolean }) {
  const { data, theme, showBranding } = props;
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Preview
      </p>
      <div className="relative h-[560px] overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
        <div className="h-full overflow-y-auto">
          <PublicProfile
            data={data}
            theme={theme}
            showBranding={showBranding}
            compact
          />
        </div>
        {/* The compact PublicProfile skips its own fixed button, so
            this absolute one is the only WhatsApp button in preview.
            It renders nothing when no number is set. */}
        <FloatingWhatsAppButton whatsapp={data.whatsapp} floating="absolute" />
      </div>
    </div>
  );
}
