import { describe, expect, it } from "vitest";

import { HERO_SHOP, SHOWCASE } from "@/routes/index";

const EMOJI = /\p{Extended_Pictographic}/u;

// The homepage mockups must look like real shops: every demo shop has a
// logo, and no demo bio carries emoji.
describe("Homepage demo shops", () => {
  const shops = [HERO_SHOP, ...SHOWCASE.map((s) => s.data)];

  it("every demo shop has a logo set", () => {
    for (const shop of shops) {
      expect(shop.avatar_url).toBeTruthy();
      expect(shop.avatar_url).toMatch(/^\/examples\/.+\.webp$/);
    }
  });

  it("no demo bio contains emoji", () => {
    for (const shop of shops) {
      expect(shop.bio).not.toMatch(EMOJI);
    }
  });

  it("every demo item uses a repo-owned example photo", () => {
    for (const shop of shops) {
      expect(shop.links.length).toBeGreaterThan(0);
      for (const item of shop.links) {
        expect(item.image_urls).toHaveLength(1);
        expect(item.image_urls?.[0]).toMatch(/^\/examples\/.+\.webp$/);
      }
    }
  });
});
