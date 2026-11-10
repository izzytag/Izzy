import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/guides")({
  component: GuidesLayout,
});

/**
 * Guides section shell: the standard marketing header, the article,
 * and a footer with the same link structure as the homepage (guides
 * included, so the section is reachable from every guide page too).
 */
function GuidesLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">Your business. Your products. One beautiful link.</p>
            </div>
            <nav aria-label="Product">
              <h3 className="text-base font-semibold">Product</h3>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                <li><Link to="/" hash="features" className="transition-colors duration-200 hover:text-foreground">Features</Link></li>
                <li><Link to="/" hash="how-it-works" className="transition-colors duration-200 hover:text-foreground">How it works</Link></li>
                <li><Link to="/" hash="examples" className="transition-colors duration-200 hover:text-foreground">Examples</Link></li>
                <li><Link to="/pricing" className="transition-colors duration-200 hover:text-foreground">Pricing</Link></li>
                <li><Link to="/guides" className="transition-colors duration-200 hover:text-foreground">Guides</Link></li>
              </ul>
            </nav>
            <nav aria-label="Support and legal">
              <h3 className="text-base font-semibold">Support &amp; legal</h3>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                <li><Link to="/contact" className="transition-colors duration-200 hover:text-foreground">Contact</Link></li>
                <li><Link to="/privacy" className="transition-colors duration-200 hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="transition-colors duration-200 hover:text-foreground">Terms</Link></li>
              </ul>
            </nav>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} izzy</p>
            <p>Your business. Your products. One beautiful link.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
