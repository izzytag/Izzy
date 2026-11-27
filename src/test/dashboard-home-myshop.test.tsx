import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Dashboard Home / My Shop change (2026-11-27)", () => {
  const home = read("src/routes/_authenticated/dashboard.index.tsx");
  const store = read("src/routes/_authenticated/dashboard.store.tsx");
  const details = read("src/components/BusinessDetails.tsx");

  it("Home no longer shows the Your products grid", () => {
    expect(home).not.toContain(">Your products</h2>");
    expect(home).toContain("<BusinessDetails");
  });

  it("My Shop has Preview/Edit toggle with Preview selected by default", () => {
    expect(store).toContain('useState<"preview" | "edit">("preview")');
    expect(store).toContain("> Preview");
    expect(store).toContain("> Edit");
    expect(store).toContain("<PhonePreview");
    expect(store).toContain("<BusinessDetails");
  });

  it("Business details save only on Save, with logo, name and WhatsApp fields", () => {
    expect(details).toContain("Business name");
    expect(details).toContain("WhatsApp number for orders");
    expect(details).toContain("Upload shop logo");
    expect(details).not.toContain("onBlur={() => void saveProfile()}");
  });
});
