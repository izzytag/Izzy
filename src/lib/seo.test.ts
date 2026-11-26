import { describe, expect, it } from "vitest";

import {
  DEFAULT_OG_IMAGE,
  LEGACY_GUIDE_REDIRECTS,
  STATIC_SITEMAP_PATHS,
  SITE_URL,
  articleJsonLd,
  buildSitemapXml,
  escapeJsonLd,
  escapeXml,
  faqPageJsonLd,
  isSitemapEligibleUsername,
  parsePriceTag,
  productJsonLd,
  seoHead,
} from "./seo";

describe("buildSitemapXml", () => {
  it("returns a valid sitemap document containing the static routes", () => {
    const xml = buildSitemapXml([...STATIC_SITEMAP_PATHS]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.endsWith("</urlset>\n")).toBe(true);
    for (const path of STATIC_SITEMAP_PATHS) {
      expect(xml).toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
  });

  it("includes shop URLs", () => {
    const xml = buildSitemapXml(["/", "/priya", "/threadstudio"]);

    expect(xml).toContain(`<loc>${SITE_URL}/priya</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/threadstudio</loc>`);
  });

  it("drops duplicate paths", () => {
    const xml = buildSitemapXml(["/", "/", "/pricing", "/pricing"]);

    expect(xml.match(/<loc>/g)).toHaveLength(2);
  });

  it("XML-escapes special characters in URLs", () => {
    const xml = buildSitemapXml(["/a&b"]);

    expect(xml).toContain(`${SITE_URL}/a&amp;b`);
    expect(xml).not.toContain("/a&b</loc>");
  });
});

describe("escapeXml", () => {
  it("escapes &, <, > and quotes", () => {
    expect(escapeXml('a&b<c>d"e')).toBe("a&amp;b&lt;c&gt;d&quot;e");
  });
});

describe("STATIC_SITEMAP_PATHS", () => {
  it("covers every public static route including all five guides", () => {
    expect([...STATIC_SITEMAP_PATHS]).toEqual([
      "/",
      "/pricing",
      "/guides",
      "/guides/create-online-shop-in-5-minutes",
      "/guides/how-to-sell-online-in-india",
      "/guides/sell-on-whatsapp",
      "/guides/instagram-bio-shop-link-setup",
      "/guides/free-online-catalogue-india",
      "/contact",
      "/terms",
      "/privacy",
    ]);
  });

  it("excludes private and noindex routes", () => {
    expect(STATIC_SITEMAP_PATHS).not.toContain("/auth");
    expect(STATIC_SITEMAP_PATHS).not.toContain("/dashboard");
    expect(STATIC_SITEMAP_PATHS).not.toContain("/admin");
    expect(STATIC_SITEMAP_PATHS).not.toContain("/onboarding");
  });
});

describe("faqPageJsonLd", () => {
  it("builds a FAQPage with every rendered question and answer", () => {
    const faqs = [
      { q: "What is izzy?", a: "A shop page." },
      { q: "Does it cost money?", a: "Free to start." },
    ];

    const parsed = JSON.parse(faqPageJsonLd(faqs)) as {
      "@type": string;
      mainEntity: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[];
    };

    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(2);
    expect(parsed.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "What is izzy?",
      acceptedAnswer: { "@type": "Answer", text: "A shop page." },
    });
  });

  it("never emits a literal closing script tag, and parses back identically", () => {
    const faqs = [{ q: "Tricky?</q>", a: "Answer with </script> inside & <b>tags</b>." }];

    const jsonLd = faqPageJsonLd(faqs);

    expect(jsonLd).not.toContain("</script>");
    expect(jsonLd).not.toContain("<");
    const parsed = JSON.parse(jsonLd) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(parsed.mainEntity[0]?.name).toBe("Tricky?</q>");
    expect(parsed.mainEntity[0]?.acceptedAnswer.text).toBe("Answer with </script> inside & <b>tags</b>.");
  });
});

describe("escapeJsonLd", () => {
  it("escapes <, > and & and line separators", () => {
    expect(escapeJsonLd('<a>&\u2028\u2029')).toBe("\\u003ca\\u003e\\u0026\\u2028\\u2029");
  });
});

describe("isSitemapEligibleUsername", () => {
  it("accepts ordinary shop usernames", () => {
    expect(isSitemapEligibleUsername("priya")).toBe(true);
    expect(isSitemapEligibleUsername("thread_studio1")).toBe(true);
  });

  it("rejects missing and malformed usernames", () => {
    expect(isSitemapEligibleUsername(null)).toBe(false);
    expect(isSitemapEligibleUsername(undefined)).toBe(false);
    expect(isSitemapEligibleUsername("")).toBe(false);
    expect(isSitemapEligibleUsername("ab")).toBe(false);
    expect(isSitemapEligibleUsername("Priya")).toBe(false);
    expect(isSitemapEligibleUsername("priya-shop")).toBe(false);
    expect(isSitemapEligibleUsername("priya shop")).toBe(false);
    expect(isSitemapEligibleUsername("a".repeat(31))).toBe(false);
  });

  it("rejects reserved and route-colliding names", () => {
    for (const name of ["auth", "dashboard", "admin", "pricing", "izzy", "api", "login"]) {
      expect(isSitemapEligibleUsername(name)).toBe(false);
    }
    for (const name of ["guides", "contact", "terms", "privacy", "shop"]) {
      expect(isSitemapEligibleUsername(name)).toBe(false);
    }
  });
});

describe("seoHead", () => {
  it("returns title, description, canonical and full OG/Twitter tags", () => {
    const head = seoHead({ title: "Pricing — izzy", description: "Simple pricing.", path: "/pricing" });

    expect(head.meta).toContainEqual({ title: "Pricing — izzy" });
    expect(head.meta).toContainEqual({ name: "description", content: "Simple pricing." });
    expect(head.meta).toContainEqual({ property: "og:title", content: "Pricing — izzy" });
    expect(head.meta).toContainEqual({ property: "og:description", content: "Simple pricing." });
    expect(head.meta).toContainEqual({ property: "og:type", content: "website" });
    expect(head.meta).toContainEqual({ property: "og:url", content: `${SITE_URL}/pricing` });
    expect(head.meta).toContainEqual({ property: "og:image", content: DEFAULT_OG_IMAGE });
    expect(head.meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" });
    expect(head.meta).toContainEqual({ name: "twitter:title", content: "Pricing — izzy" });
    expect(head.meta).toContainEqual({ name: "twitter:description", content: "Simple pricing." });
    expect(head.meta).toContainEqual({ name: "twitter:image", content: DEFAULT_OG_IMAGE });
    expect(head.links).toEqual([{ rel: "canonical", href: `${SITE_URL}/pricing` }]);
  });

  it("honours og overrides and a custom image", () => {
    const head = seoHead({
      title: "T",
      description: "D",
      path: "/guides",
      ogTitle: "OG title",
      ogDescription: "OG description",
      ogType: "article",
      ogImage: "https://example.com/img.png",
    });

    expect(head.meta).toContainEqual({ property: "og:title", content: "OG title" });
    expect(head.meta).toContainEqual({ property: "og:description", content: "OG description" });
    expect(head.meta).toContainEqual({ property: "og:type", content: "article" });
    expect(head.meta).toContainEqual({ property: "og:image", content: "https://example.com/img.png" });
    expect(head.meta).toContainEqual({ name: "twitter:title", content: "OG title" });
  });

  it("uses the site root as the canonical URL for the homepage", () => {
    const head = seoHead({ title: "izzy", description: "Shop.", path: "/" });

    expect(head.links).toEqual([{ rel: "canonical", href: `${SITE_URL}/` }]);
    expect(head.meta).toContainEqual({ property: "og:url", content: `${SITE_URL}/` });
  });
});

describe("LEGACY_GUIDE_REDIRECTS", () => {
  it("maps both deleted guide slugs to their live replacements", () => {
    expect(LEGACY_GUIDE_REDIRECTS["/guides/sell-on-whatsapp-without-website"]).toBe("/guides/sell-on-whatsapp");
    expect(LEGACY_GUIDE_REDIRECTS["/guides/instagram-bio-link"]).toBe("/guides/instagram-bio-shop-link-setup");
  });

  it("only redirects to routes that are in the sitemap", () => {
    for (const target of Object.values(LEGACY_GUIDE_REDIRECTS)) {
      expect(STATIC_SITEMAP_PATHS).toContain(target);
    }
    for (const source of Object.keys(LEGACY_GUIDE_REDIRECTS)) {
      expect(STATIC_SITEMAP_PATHS).not.toContain(source);
    }
  });
});

describe("articleJsonLd", () => {
  it("builds an Article whose headline and URL match the live guide", () => {
    const parsed = JSON.parse(
      articleJsonLd({
        title: "How to sell on WhatsApp with a shop link",
        description: "A practical guide.",
        path: "/guides/sell-on-whatsapp",
      }),
    ) as { "@type": string; headline: string; mainEntityOfPage: string };

    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("How to sell on WhatsApp with a shop link");
    expect(parsed.mainEntityOfPage).toBe(`${SITE_URL}/guides/sell-on-whatsapp`);
  });

  it("never emits a literal closing script tag", () => {
    const jsonLd = articleJsonLd({ title: "T</script>", description: "D & <b>", path: "/guides/sell-on-whatsapp" });

    expect(jsonLd).not.toContain("</script>");
    expect(jsonLd).not.toContain("<");
  });
});

describe("parsePriceTag", () => {
  it("parses rupee and dollar tags", () => {
    expect(parsePriceTag("₹499")).toEqual({ amount: 499, currency: "INR" });
    expect(parsePriceTag("₹1,299")).toEqual({ amount: 1299, currency: "INR" });
    expect(parsePriceTag("$12.50")).toEqual({ amount: 12.5, currency: "USD" });
  });

  it("returns null for missing, bare or non-numeric prices", () => {
    expect(parsePriceTag(null)).toBeNull();
    expect(parsePriceTag(undefined)).toBeNull();
    expect(parsePriceTag("")).toBeNull();
    expect(parsePriceTag("499")).toBeNull();
    expect(parsePriceTag("Price on request")).toBeNull();
    expect(parsePriceTag("₹0")).toBeNull();
  });
});

describe("productJsonLd", () => {
  it("includes an Offer only when the price tag parses", () => {
    const withPrice = productJsonLd(
      { name: "Chocolate cake", description: "Rich Belgian chocolate.", image: "https://example.com/cake.webp", price: "₹499" },
      `${SITE_URL}/hetvi`,
    ) as { offers: { price: number; priceCurrency: string } };

    expect(withPrice.offers).toEqual({
      "@type": "Offer",
      price: 499,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/hetvi`,
    });

    const withoutPrice = productJsonLd({ name: "Cake", price: "Price on request" }, `${SITE_URL}/hetvi`) as {
      offers?: unknown;
    };

    expect(withoutPrice.offers).toBeUndefined();
  });
});
