import { PublicProfile, type PublicData } from "./PublicProfile";
import type { ThemeId } from "@/lib/themes";

export function PhonePreview(props: { data: PublicData; theme: ThemeId; showBranding: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
      <div className="h-[560px] overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
        <div className="h-full overflow-y-auto">
          <PublicProfile {...props} compact />
        </div>
      </div>
    </div>
  );
}
