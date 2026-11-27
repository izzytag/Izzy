import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Wise-inspired brand look (board 2026-11-27) on the public website:
// white pages, near-black text, deep forest #163300 as primary
// ink/action (forest buttons with lime text, forest links/icons),
// Izzy Lime #9FE870 for hero bands and text on forest, light mint
// #E2F6D5 soft surfaces, sage #E8EBE6 muted/borders, pill buttons,
// bold uppercase headlines. WhatsApp green #25D366 stays separate
// and is only for buying actions. No violet. Inter stays (Wise Sans
// / Anton are not in the project) — no new font dependency.

function src(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("wise brand tokens", () => {
  it("uses white pages, forest primary, and lime on forest", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--background:\s*#FFFFFF/);
    expect(css).toMatch(/--foreground:\s*#0E0F0C/);
    expect(css).toMatch(/--primary:\s*#163300/);
    expect(css).toMatch(/--primary-foreground:\s*#9FE870/);
    expect(css).toMatch(/--primary-soft:\s*#E2F6D5/);
    expect(css).toMatch(/--ring:\s*#163300/);
    expect(css).toMatch(/--radius:\s*1rem/);
    expect(css).toMatch(/--border:\s*#E8EBE6/);
  });

  it("has no violet or warm off-white left in tokens", () => {
    const css = src("src/styles.css");
    expect(css).not.toMatch(/#7457E8/);
    expect(css).not.toMatch(/#FAF9F6/);
    expect(css).not.toMatch(/#EFEAFB/);
    expect(css).not.toMatch(/#F2F0EC/);
  });

  it("keeps WhatsApp green intact and separate from lime", () => {
    const css = src("src/styles.css");
    expect(css).toMatch(/--whatsapp:\s*#25D366/);
    const card = src("src/components/CatalogueCard.tsx");
    expect(card).toMatch(/bg-whatsapp text-\[17px\].*Order on WhatsApp/);
    expect(card).not.toMatch(/bg-\[#9FE870\].*Order on WhatsApp/);
  });

  it("buttons are pill-shaped", () => {
    const button = src("src/components/ui/button.tsx");
    expect(button).toMatch(/rounded-full/);
    expect(button).not.toMatch(/rounded-lg text-base/);
  });

  it("wordmark uses a forest tile with lime i", () => {
    const logo = src("src/components/Logo.tsx");
    expect(logo).toMatch(/rounded-full bg-primary text-sm text-primary-foreground/);
    expect(logo).toMatch(/izzy<span className="text-primary">\.<\/span>/);
  });

  it("homepage hero is a lime band with forest uppercase headline", () => {
    const index = src("src/routes/index.tsx");
    expect(index).toMatch(/bg-\[#9FE870\] text-\[#163300\]/);
    expect(index).toMatch(/font-black uppercase/);
    expect(index).toMatch(/Your business deserves more than an Instagram bio\./);
    // Final CTA is forest with a lime button.
    expect(index).toMatch(/rounded-3xl bg-primary/);
    expect(index).toMatch(/bg-\[#9FE870\] text-\[#163300\]/);
  });
});
