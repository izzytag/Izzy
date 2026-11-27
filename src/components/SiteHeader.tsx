import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

/**
 * Marketing header: wordmark left, section anchors centre (they point
 * at homepage sections, so from other pages they go home first),
 * Log in and the primary CTA right. On mobile the anchors collapse
 * into a compact menu panel.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const anchors = [
    { hash: "features", label: "Features" },
    { hash: "how-it-works", label: "How it works" },
    { hash: "examples", label: "Examples" },
    { hash: "pricing", label: "Pricing" },
  ];
  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-border bg-white px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {anchors.map((a) => (
            <Link key={a.hash} to="/" hash={a.hash} className="flex h-11 items-center rounded-full px-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
              {a.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden h-11 items-center rounded-full px-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground sm:flex">
            Log in
          </Link>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/auth">Create your free shop</Link>
          </Button>
          <button onClick={() => setOpen((o) => !o)} className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-card md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mx-auto mt-2 w-full max-w-7xl rounded-3xl border border-border bg-white px-4 py-3 md:hidden" aria-label="Menu">
          <div className="flex flex-col">
            {anchors.map((a) => (
              <Link key={a.hash} to="/" hash={a.hash} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-full px-3 text-base font-medium hover:bg-muted">
                {a.label}
              </Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-full px-3 text-base font-medium hover:bg-muted">
              Log in
            </Link>
            <Button asChild className="mt-2 w-full">
              <Link to="/auth" onClick={() => setOpen(false)}>Create your free shop</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
