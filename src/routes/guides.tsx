import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/guides")({
  component: GuidesLayout,
});

/**
 * Guides section shell: the standard marketing header, the article,
 * and the shared site footer.
 */
function GuidesLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
