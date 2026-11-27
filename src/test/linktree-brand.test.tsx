import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Linktree-inspired brand (preview/linktree-brand)", () => {
  const styles = read("src/styles.css");
  const button = read("src/components/ui/button.tsx");
  const logo = read("src/components/Logo.tsx");
  const header = read("src/components/SiteHeader.tsx");
  const home = read("src/routes/index.tsx");
  const guide = read("src/components/GuideArticle.tsx");

  it("uses ink primary with chartreuse text, bone pages, flat hero", () => {
    expect(styles).toContain("--primary: #1E2330");
    expect(styles).toContain("--primary-foreground: #D2E823");
    expect(styles).toContain("--background: #F3F3F1");
    expect(styles).toContain("--foreground: #1E2330");
    expect(styles).toContain("--gradient-hero: none");
    expect(styles).not.toContain("#7457E8");
  });

  it("keeps WhatsApp green separate and unchanged", () => {
    expect(styles).toContain("--whatsapp: #25D366");
  });

  it("buttons are pill-shaped", () => {
    expect(button).toContain("rounded-full text-base font-semibold");
    expect(button).not.toContain("rounded-lg");
  });

  it("wordmark uses a circular ink tile with chartreuse letter", () => {
    expect(logo).toContain("rounded-full bg-primary");
    expect(logo).toContain("text-primary-foreground");
  });

  it("header is a floating white pill nav", () => {
    expect(header).toContain("sticky top-3");
    expect(header).toContain("rounded-full border border-border bg-white");
  });

  it("homepage hero is flat chartreuse with ink text and a cobalt final CTA", () => {
    expect(home).toContain("bg-[#D2E823] text-[#1E2330]");
    expect(home).toContain("font-black");
    expect(home).toContain("bg-[#2665D6]");
    expect(guide).toContain("bg-[#2665D6]");
    expect(home).not.toContain("#9FE870");
  });
});
