import { describe, expect, it } from "vitest";

import { HERO_SHOP, SHOWCASE } from "@/routes/index";

const EMOJI = /\p{Extended_Pictographic}/u;

// The homepage mockups must look like real shops: every demo shop
// either has a repo-owned logo or falls back to the initial-letter
// circle PublicProfile renders for a null avatar (no fake logos),
// and no demo bio carries emoji.
describe("Homepage demo shops", () => {
  const shops = [HERO_SHOP, ...SHOWCASE.map((s) => s.data)];

  it("every demo shop has a logo set, or no logo at all", () => {
    for (const shop of shops) {
      if (shop.avatar_url !== null) {
        expect(shop.avatar_url).toMatch(/^\/examples\/.+\.webp$/);
      }
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
