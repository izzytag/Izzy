import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Muji brand look ("Quiet by design") on the public website: paper
// background, near-black ink, hairline borders, near-square corners,
// and one muted brick-red accent used sparingly — the primary action
// button and the wordmark full stop only. WhatsApp green stays green.

function src(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("muji brand tokens", () => {
  it("uses paper for the page background and brick red for the accent", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--background:\s*#F6F4EF/);
    expect(css).toMatch(/--primary:\s*#A63A2B/);
    expect(css).toMatch(/--ring:\s*#A63A2B/);
    expect(css).toMatch(/--radius:\s*0\.375rem/);
    expect(css).toMatch(/--border:\s*#E7E3DB/);
    expect(css).toMatch(/--foreground:\s*#1C1C1C/);
    expect(css).toMatch(/--primary-soft:\s*#EFEBE4/);
  });

  it("has no violet or cream left on public pages", () => {
    const css = src("src/styles.css");
    expect(css).not.toMatch(/#7457E8/);
    expect(css).not.toMatch(/#FAF9F6/);
    expect(css).not.toMatch(/#EFEAFB/);
  });

  it("keeps WhatsApp green intact", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--whatsapp:\s*#25D366/);
    const card = src("src/components/CatalogueCard.tsx");
    expect(card).toMatch(/bg-whatsapp/);
  });

  it("wordmark is plain text with a brick full stop and no coloured tile", () => {
    const logo = src("src/components/Logo.tsx");
    expect(logo).toMatch(/izzy<span className="text-primary">\.<\/span>/);
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

  it("red does not spread to links, headings, or cards on the homepage", () => {
    const index = src("src/routes/index.tsx");
    expect(index).not.toMatch(/text-primary[^/]/);
    expect(index).not.toMatch(/bg-primary /);
    expect(index).not.toMatch(/rounded-3xl/);
    // The one rounded-full left is the circular avatar in the WhatsApp
    // mockup — a literal circle, not a pill button or card.
    expect(index.match(/rounded-full/g)?.length).toBe(1);
    expect(index).toMatch(/rounded-full bg-foreground/);
    expect(index).toMatch(/View demo shop/);
  });

  it("shop-page and demo calls to action keep the brick primary action", () => {
    const shop = src("src/routes/$username.tsx");
    expect(shop).toMatch(/rounded-md bg-primary/);
    expect(shop).not.toMatch(/rounded-full bg-primary/);
    const demo = src("src/routes/demo.tsx");
    expect(demo).toMatch(/bg-foreground/);
  });
});
