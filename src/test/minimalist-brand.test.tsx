import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Minimalist brand look (board V5) on the public website: pure white
// pages, ink text, one neutral gray scale, near-square corners, and
// a single ink "primary" — primary buttons are black with white
// text. The only colour anywhere is WhatsApp green #25D366,
// reserved for buying actions (Order on WhatsApp, the floating chat
// button) and the green full stop in the "izzy." wordmark. No violet,
// no cream, no warm tints. Manrope is not in the project, so the
// existing Inter/system sans stays — no new font dependency.

function src(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("minimalist brand tokens", () => {
  it("uses pure white for the page background and ink for the primary action", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--background:\s*#FFFFFF/);
    expect(css).toMatch(/--foreground:\s*#111111/);
    expect(css).toMatch(/--primary:\s*#111111/);
    expect(css).toMatch(/--primary-foreground:\s*#FFFFFF/);
    expect(css).toMatch(/--ring:\s*#111111/);
    expect(css).toMatch(/--radius:\s*0\.375rem/);
    expect(css).toMatch(/--border:\s*#E5E5E5/);
    expect(css).toMatch(/--primary-soft:\s*#F5F5F5/);
    expect(css).toMatch(/--gradient-hero:\s*none/);
  });

  it("has no violet, cream, or warm tint left on public pages", () => {
    const css = src("src/styles.css");
    expect(css).not.toMatch(/#7457E8/);
    expect(css).not.toMatch(/#FAF9F6/);
    expect(css).not.toMatch(/#EFEAFB/);
    expect(css).not.toMatch(/#F2F0EC/);
    expect(css).not.toMatch(/#EAE8E3/);
  });

  it("keeps WhatsApp green intact and only on buying actions", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--whatsapp:\s*#25D366/);
    const card = src("src/components/CatalogueCard.tsx");
    // Both bg-whatsapp hits are the one Order button line.
    expect(card.match(/bg-whatsapp/g)?.length).toBe(2);
    expect(card).toMatch(/bg-whatsapp text-\[17px\].*Order on WhatsApp/);
    const floating = src("src/components/FloatingWhatsAppButton.tsx");
    expect(floating).toMatch(/#25D366/);
    // The homepage's only green is the WhatsApp reply bubble in the
    // ordering mockup — a depiction of a WhatsApp message, not chrome.
    const index = src("src/routes/index.tsx");
    expect(index).toMatch(/bg-whatsapp\/10/);
    expect(index).not.toMatch(/text-whatsapp/);
    expect(index).not.toMatch(/bg-whatsapp text-/);
  });

  it("wordmark is plain text with a green full stop and no coloured tile", () => {
    const logo = src("src/components/Logo.tsx");
    expect(logo).toMatch(/izzy<span className="text-whatsapp">\.<\/span>/);
    expect(logo).not.toMatch(/bg-primary/);
    expect(logo).not.toMatch(/rounded-lg bg-primary/);
  });

  it("buttons are near-square, never pill-shaped", () => {
    const button = src("src/components/ui/button.tsx");
    expect(button).toMatch(/rounded-md/);
    expect(button).not.toMatch(/rounded-full/);
    expect(button).not.toMatch(/rounded-lg/);
  });

  it("prices are plain label-style text, not bold coloured prices", () => {
    const card = src("src/components/CatalogueCard.tsx");
    expect(card).toMatch(/text-base font-medium/);
    expect(card).not.toMatch(/font-bold tracking-tight">\{item\.price\}/);
    expect(card).not.toMatch(/text-\[17px\] font-bold/);
    expect(card).not.toMatch(/text-\[22px\] font-bold/);
  });

  it("the homepage is ink on white: no coloured links, headings, or cards", () => {
    const index = src("src/routes/index.tsx");
    // The only bg-primary is the ink final-CTA panel; the only
    // text-primary hits are inside that same panel (white button,
    // white sub-copy). Everything else is ink or muted gray.
    expect(index.match(/bg-primary(?![-a-z])/g)?.length).toBe(1);
    expect(index).toMatch(/rounded-md bg-primary px-6 py-14/);
    expect(index).not.toMatch(/text-primary"/);
    expect(index).not.toMatch(/rounded-3xl/);
    // The one rounded-full left is the circular avatar in the WhatsApp
    // mockup — a literal circle, not a pill button or card.
    expect(index.match(/rounded-full/g)?.length).toBe(1);
    expect(index).toMatch(/rounded-full bg-foreground/);
    expect(index).toMatch(/View demo shop/);
  });

  it("shop-page and demo calls to action keep the ink primary action", () => {
    const shop = src("src/routes/$username.tsx");
    expect(shop).toMatch(/rounded-md bg-primary/);
    expect(shop).not.toMatch(/rounded-full bg-primary/);
    const demo = src("src/routes/demo.tsx");
    expect(demo).toMatch(/bg-foreground/);
  });
});
