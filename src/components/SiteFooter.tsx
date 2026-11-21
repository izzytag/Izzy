import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

/**
 * Shared marketing footer: wordmark and tagline once, then the only
 * links a visitor still needs — the guides, contact, and the legal
 * pages. Used by the homepage, the pricing page and the guides
 * layout so the three stay identical.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">Your business. Your products. One shop link.</p>
          </div>
          <nav aria-label="Site links">
            <ul className="space-y-2.5 text-muted-foreground">
              <li><Link to="/guides" className="transition-colors duration-200 hover:text-foreground">Guides</Link></li>
              <li><Link to="/contact" className="transition-colors duration-200 hover:text-foreground">Contact</Link></li>
              <li><Link to="/privacy" className="transition-colors duration-200 hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms" className="transition-colors duration-200 hover:text-foreground">Terms</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} izzy</p>
        </div>
      </div>
    </footer>
  );
}
