import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";
import { Route as IndexRoute } from "@/routes/index";
import { Route as PricingRoute } from "@/routes/pricing";
import { Route as GuidesIndexRoute, GUIDES } from "@/routes/guides.index";
import { Route as CreateShop5MinRoute } from "@/routes/guides.create-online-shop-in-5-minutes";
import { Route as SellOnlineIndiaRoute } from "@/routes/guides.how-to-sell-online-in-india";
import { Route as SellOnWhatsAppRoute } from "@/routes/guides.sell-on-whatsapp";
import { Route as BioSetupRoute } from "@/routes/guides.instagram-bio-shop-link-setup";
import { Route as CatalogueIndiaRoute } from "@/routes/guides.free-online-catalogue-india";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as TermsRoute } from "@/routes/terms";
import { Route as PrivacyRoute } from "@/routes/privacy";
import { Route as UsernameRoute } from "@/routes/$username";

// Route head functions are invoked directly: loaders never run, so
// no server or network is needed, and the exact tags the route
// declares are what gets asserted.
type HeadResult = {
  meta?: Record<string, unknown>[];
  links?: Record<string, unknown>[];
  scripts?: { type?: string; children?: string }[];
};

function getHead(route: unknown, ctx?: unknown): HeadResult {
  const options = (route as { options: { head: (ctx: unknown) => HeadResult } }).options;
  return options.head(ctx);
}

function metaContent(head: HeadResult, attr: "name" | "property", key: string): unknown {
  return head.meta?.find((m) => m[attr] === key)?.["content"];
}

function titleOf(head: HeadResult): unknown {
  return head.meta?.find((m) => typeof m["title"] === "string")?.["title"];
}

function canonicalOf(head: HeadResult): unknown {
  return head.links?.find((l) => l["rel"] === "canonical")?.["href"];
}

const STATIC_ROUTES: { path: string; route: unknown }[] = [
  { path: "/", route: IndexRoute },
  { path: "/pricing", route: PricingRoute },
  { path: "/guides", route: GuidesIndexRoute },
  { path: "/guides/create-online-shop-in-5-minutes", route: CreateShop5MinRoute },
  { path: "/guides/how-to-sell-online-in-india", route: SellOnlineIndiaRoute },
  { path: "/guides/sell-on-whatsapp", route: SellOnWhatsAppRoute },
  { path: "/guides/instagram-bio-shop-link-setup", route: BioSetupRoute },
  { path: "/guides/free-online-catalogue-india", route: CatalogueIndiaRoute },
  { path: "/contact", route: ContactRoute },
  { path: "/terms", route: TermsRoute },
  { path: "/privacy", route: PrivacyRoute },
];

describe("public route head tags", () => {
  it("every public route carries title, description, canonical and OG/Twitter tags", () => {
    for (const { path, route } of STATIC_ROUTES) {
      const head = getHead(route);
      expect(typeof titleOf(head), `${path} title`).toBe("string");
      expect((titleOf(head) as string).length, `${path} title`).toBeGreaterThan(0);
      expect(typeof metaContent(head, "name", "description"), `${path} description`).toBe("string");
      expect((metaContent(head, "name", "description") as string).length, `${path} description`).toBeGreaterThan(0);
      expect(canonicalOf(head), `${path} canonical`).toBe(`${SITE_URL}${path}`);
      expect(metaContent(head, "property", "og:title"), `${path} og:title`).toBeTruthy();
      expect(metaContent(head, "property", "og:description"), `${path} og:description`).toBeTruthy();
      expect(metaContent(head, "property", "og:type"), `${path} og:type`).toBeTruthy();
      expect(metaContent(head, "property", "og:url"), `${path} og:url`).toBe(`${SITE_URL}${path}`);
      expect(metaContent(head, "property", "og:image"), `${path} og:image`).toBeTruthy();
      expect(metaContent(head, "name", "twitter:card"), `${path} twitter:card`).toBeTruthy();
      expect(metaContent(head, "name", "twitter:title"), `${path} twitter:title`).toBeTruthy();
      expect(metaContent(head, "name", "twitter:description"), `${path} twitter:description`).toBeTruthy();
      expect(metaContent(head, "name", "twitter:image"), `${path} twitter:image`).toBeTruthy();
    }
  });

  it("every public route has a unique title", () => {
    const titles = STATIC_ROUTES.map(({ route }) => titleOf(getHead(route)));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("homepage head carries FAQPage JSON-LD matching the rendered FAQ", () => {
    const head = getHead(IndexRoute);
    const faqScript = head.scripts?.find((s) => {
      if (s.type !== "application/ld+json" || !s.children) return false;
      try {
        return (JSON.parse(s.children) as { "@type"?: string })["@type"] === "FAQPage";
      } catch {
        return false;
      }
    });
    expect(faqScript).toBeDefined();
    const parsed = JSON.parse(faqScript!.children!) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(parsed.mainEntity).toHaveLength(4);
    expect(parsed.mainEntity.map((q) => q.name)).toContain("What is izzy?");
    expect(parsed.mainEntity.map((q) => q.name)).toContain("Does izzy process payments?");
    expect(parsed.mainEntity.map((q) => q.name)).not.toContain("Can customers order through WhatsApp?");
    expect(parsed.mainEntity.map((q) => q.name)).not.toContain("Can I share my shop on Instagram?");
    expect(parsed.mainEntity.map((q) => q.name)).not.toContain("Do I need technical knowledge?");
    for (const q of parsed.mainEntity) {
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(0);
    }
  });

  it("pricing head carries FAQPage JSON-LD matching the rendered billing questions", () => {
    const head = getHead(PricingRoute);
    const faqScript = head.scripts?.find((s) => s.type === "application/ld+json" && !!s.children);
    expect(faqScript).toBeDefined();
    const parsed = JSON.parse(faqScript!.children!) as {
      "@type": string;
      mainEntity: { name: string }[];
    };
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(6);
    expect(parsed.mainEntity.map((q) => q.name)).toContain("How does billing work?");
    expect(parsed.mainEntity.map((q) => q.name)).toContain("How do I cancel?");
  });
});

describe("shop page head tags", () => {
  const liveShop = {
    suspended: false as const,
    profile: {
      id: "user-1",
      username: "priya",
      display_name: "Priya's Kitchen",
      bio: "Homemade cakes in Pune",
      category: null,
      avatar_url: "https://example.com/avatar.png",
      theme: "light",
      socials: {},
      whatsapp: null,
      upi_id: null,
      suspended: false,
    },
    links: [],
    isPro: false,
  };

  it("carries canonical, og:url and the seller avatar as share image", () => {
    const head = getHead(UsernameRoute, { loaderData: liveShop });

    expect(canonicalOf(head)).toBe(`${SITE_URL}/priya`);
    expect(metaContent(head, "property", "og:url")).toBe(`${SITE_URL}/priya`);
    expect(metaContent(head, "property", "og:image")).toBe("https://example.com/avatar.png");
    expect(metaContent(head, "name", "twitter:image")).toBe("https://example.com/avatar.png");
    expect(titleOf(head)).toBe("Priya's Kitchen (@priya) | izzy");
  });

  it("falls back to the default share image when the shop has no avatar", () => {
    const noAvatar = { ...liveShop, profile: { ...liveShop.profile, avatar_url: null } };
    const head = getHead(UsernameRoute, { loaderData: noAvatar });

    expect(metaContent(head, "property", "og:image")).toBe(DEFAULT_OG_IMAGE);
    expect(metaContent(head, "name", "twitter:image")).toBe(DEFAULT_OG_IMAGE);
  });

  it("keeps suspended and missing shops noindex", () => {
    expect(metaContent(getHead(UsernameRoute, { loaderData: undefined }), "name", "robots")).toBe("noindex");
    const suspended = { suspended: true as const, username: "priya", displayName: "Priya's Kitchen" };
    expect(metaContent(getHead(UsernameRoute, { loaderData: suspended }), "name", "robots")).toBe("noindex");
  });
});

describe("new guide routes", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches the five guide pages, not the shop route", () => {
    const cases: [string, string][] = [
      ["/guides/create-online-shop-in-5-minutes", "/guides/create-online-shop-in-5-minutes"],
      ["/guides/how-to-sell-online-in-india", "/guides/how-to-sell-online-in-india"],
      ["/guides/sell-on-whatsapp", "/guides/sell-on-whatsapp"],
      ["/guides/instagram-bio-shop-link-setup", "/guides/instagram-bio-shop-link-setup"],
      ["/guides/free-online-catalogue-india", "/guides/free-online-catalogue-india"],
    ];
    for (const [url, routeId] of cases) {
      expect(router.matchRoutes(url).at(-1)?.routeId).toBe(routeId);
    }
  });

  it("lists all five guides in the guides index", () => {
    expect(GUIDES.map((g) => g.to)).toEqual([
      "/guides/create-online-shop-in-5-minutes",
      "/guides/how-to-sell-online-in-india",
      "/guides/sell-on-whatsapp",
      "/guides/instagram-bio-shop-link-setup",
      "/guides/free-online-catalogue-india",
    ]);
    for (const guide of GUIDES) {
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.summary.length).toBeGreaterThan(0);
    }
  });
});

describe("SEO work 2026-11-24", () => {
  it("homepage title and description target the searches sellers type", () => {
    const head = getHead(IndexRoute);

    expect(titleOf(head)).toBe("Create your online shop in India — sell on WhatsApp | izzy");
    expect(metaContent(head, "name", "description") as string).toContain("home bakery");
    expect(metaContent(head, "name", "description") as string).toContain("WhatsApp");
  });

  it("every guide carries Article JSON-LD matching its own H1 and URL", () => {
    const guides: { route: unknown; headline: string; path: string }[] = [
      {
        route: CreateShop5MinRoute,
        headline: "Create Your Online Shop in 5 Minutes — Free, Without a Website",
        path: "/guides/create-online-shop-in-5-minutes",
      },
      {
        route: SellOnlineIndiaRoute,
        headline: "How to Sell Online in India: A Simple Guide for Small Business Owners",
        path: "/guides/how-to-sell-online-in-india",
      },
      { route: SellOnWhatsAppRoute, headline: "How to sell on WhatsApp with a shop link", path: "/guides/sell-on-whatsapp" },
      { route: BioSetupRoute, headline: "How to set up a shop link for your Instagram bio", path: "/guides/instagram-bio-shop-link-setup" },
      { route: CatalogueIndiaRoute, headline: "How to create a free online catalogue for your small business in India", path: "/guides/free-online-catalogue-india" },
    ];
    for (const g of guides) {
      const head = getHead(g.route);
      const article = head.scripts
        ?.map((s) => {
          try {
            return JSON.parse(s.children ?? "") as { "@type"?: string };
          } catch {
            return null;
          }
        })
        .find((p) => p?.["@type"] === "Article") as
        | { headline: string; mainEntityOfPage: string; description: string }
        | undefined;
      expect(article, g.path).toBeDefined();
      expect(article!.headline).toBe(g.headline);
      expect(article!.mainEntityOfPage).toBe(`${SITE_URL}${g.path}`);
      expect(article!.description.length).toBeGreaterThan(0);
    }
  });

  it("shop head emits one Product node per catalogue item, with an Offer only for parsed prices", () => {
    const shopWithProducts = {
      suspended: false as const,
      profile: {
        id: "user-1",
        username: "priya",
        display_name: "Priya's Kitchen",
        bio: "Homemade cakes in Pune",
        category: null,
        avatar_url: "https://example.com/avatar.png",
        theme: "light",
        socials: {},
        whatsapp: null,
        upi_id: null,
        suspended: false,
      },
      links: [
        { id: "p1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: ["https://example.com/cake.webp"], category: null },
        { id: "p2", title: "Sourdough loaf", url: "#", kind: "product", price: "Price on request", description: "Slow-fermented.", image_urls: [], category: null },
      ],
      isPro: false,
    };
    const head = getHead(UsernameRoute, { loaderData: shopWithProducts });
    const script = head.scripts?.find((s) => s.type === "application/ld+json");
    expect(script).toBeDefined();
    const parsed = JSON.parse(script!.children!) as {
      "@graph": { "@type": string; name?: string; offers?: { price: number; priceCurrency: string } }[];
    };
    expect(parsed["@graph"][0]).toMatchObject({ "@type": "Store", name: "Priya's Kitchen" });
    const products = parsed["@graph"].filter((n) => n["@type"] === "Product");
    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({ name: "Chocolate cake" });
    expect(products[0]!.offers).toMatchObject({ price: 499, priceCurrency: "INR" });
    expect(products[1]).toMatchObject({ name: "Sourdough loaf" });
    expect(products[1]!.offers).toBeUndefined();
  });
});
