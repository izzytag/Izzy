import { PublicProfile, type PublicData } from "./PublicProfile";
import { type ThemeId } from "@/lib/themes";

/**
 * Preview: a phone frame around the seller's real storefront — the
 * shop page is the only public page, so there is no view switching.
 * The frame is a static illustration of the shop: no floating
 * WhatsApp button renders inside it (the live shop shows the
 * button; in the frame it would cover catalogue cards).
 */
export function PhonePreview(props: { data: PublicData; theme: ThemeId; showBranding: boolean }) {
  const { data, theme, showBranding } = props;
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Preview
      </p>
      <div className="relative h-[560px] overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
        <div className="h-full touch-manipulation overflow-y-auto overscroll-contain">
          <PublicProfile
            data={data}
            theme={theme}
            showBranding={showBranding}
            compact
          />
        </div>
      </div>
    </div>
  );
}
