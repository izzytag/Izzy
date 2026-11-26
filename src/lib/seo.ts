/**
 * Shared SEO helpers: canonical URLs, Open Graph / Twitter tags,
 * FAQ structured data, and the sitemap builder. Pure functions only —
 * no network, no env — so every helper is unit-testable.
 *
 * Only facts go into structured data: page titles, descriptions and
 * Q&A that are actually rendered on the page. No ratings, reviews,
 * statistics or testimonials are claimed anywhere.
 */
import { RESERVED } from "./themes";

export const SITE_URL = "https://izzytag.shop";

/** Default share image: a repo-owned example product photo. Shop
 *  pages override this with the seller's own avatar when one exists. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/examples/chocolate-cake.webp`;

/**
 * Escape serialized JSON for safe embedding in a <script> block.
 * JSON.stringify does not escape < > &, so a value containing
 * </script> could otherwise break out of the block. \uXXXX escapes
 * are valid JSON and keep the HTML parser from ever seeing a tag.
 * Mirrors the escaping in src/routes/$username.tsx (the H1 fix).
 */
export function escapeJsonLd(serialized: string): string {
  return serialized
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export type FaqEntry = { q: string; a: string };

/**
 * FAQPage JSON-LD for a page's own rendered Q&A. Only ever pass
 * questions and answers that are actually rendered on the page —
 * search engines require the visible content to match.
 */
export function faqPageJsonLd(faqs: readonly FaqEntry[]): string {
  return escapeJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
  );
}

/**
 * Guide URLs deleted in the Nov 2026 slim-down, and where each one
 * moved to. The old slugs 404 live with no redirect; server.ts
 * 301s them so old links, shares and any indexed copies land on
 * the live guide instead of a dead page.
 */
export const LEGACY_GUIDE_REDIRECTS: Readonly<Record<string, string>> = {
  "/guides/sell-on-whatsapp-without-website": "/guides/sell-on-whatsapp",
  "/guides/instagram-bio-link": "/guides/instagram-bio-shop-link-setup",
};

/**
 * Article JSON-LD for a guide: headline + description must match the
 * article's own rendered H1 and intro — search engines require the
 * visible content to match. Author/publisher are the platform
 * itself; no author person, date or rating is claimed.
 */
export function articleJsonLd(opts: { title: string; description: string; path: string }): string {
  return escapeJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      mainEntityOfPage: `${SITE_URL}${opts.path}`,
      author: { "@type": "Organization", name: "izzy", url: `${SITE_URL}/` },
      publisher: {
        "@type": "Organization",
        name: "izzy",
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
      },
    }),
  );
}

/**
 * Parse a seller-typed price tag such as "₹499" or "$12.50" into a
 * numeric amount + ISO currency. Only the currency the symbol
 * actually states is claimed; anything else returns null and the
 * product simply gets no Offer in its structured data.
 */
export function parsePriceTag(price: string | null | undefined): { amount: number; currency: string } | null {
  if (!price) return null;
  const trimmed = price.trim();
  const match = /^([₹$])\s*([\d,]+(?:\.\d{1,2})?)$/.exec(trimmed);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency: match[1] === "₹" ? "INR" : "USD" };
}

export type ProductJsonLdInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  /** Seller-typed price tag, e.g. "₹499". */
  price?: string | null;
};

/**
 * Product JSON-LD for one catalogue item, built only from the
 * seller's own saved fields. An Offer is included only when the
 * price tag parses to a real amount + currency (see parsePriceTag).
 */
export function productJsonLd(product: ProductJsonLdInput, shopUrl: string) {
  const item: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: shopUrl,
  };
  if (product.description) item.description = product.description;
  if (product.image?.startsWith("https://")) item.image = product.image;
  const parsed = parsePriceTag(product.price);
  if (parsed) {
    item.offers = {
      "@type": "Offer",
      price: parsed.amount,
      priceCurrency: parsed.currency,
      availability: "https://schema.org/InStock",
      url: shopUrl,
    };
  }
  return item;
}

/** Public static routes that belong in the sitemap. Update this list
 *  when adding or removing a public route. Deliberately excludes
 *  /auth (noindex) and /dashboard, /admin, /onboarding (private). */
export const STATIC_SITEMAP_PATHS: readonly string[] = [
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
];

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build a sitemap document from site paths (e.g. "/pricing" and
 *  "/username"). Duplicates are dropped; URLs are XML-escaped. */
export function buildSitemapXml(paths: readonly string[]): string {
  const urls = [...new Set(paths)]
    .map((p) => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${p}`)}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * First path segments that are real routes, not shops. A username
 * equal to one of these could never render as a shop (static routes
 * win over /$username), so it must never appear in the sitemap.
 * Covers the reserved usernames plus the public static sections.
 */
const SITEMAP_EXCLUDED_USERNAMES = new Set([
  ...RESERVED,
  "guides",
  "contact",
  "terms",
  "privacy",
  "shop",
]);

/** True when a profile username may appear in the sitemap: valid
 *  username format and not a name that collides with a real route. */
export function isSitemapEligibleUsername(username: string | null | undefined): username is string {
  if (!username) return false;
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return false;
  return !SITEMAP_EXCLUDED_USERNAMES.has(username);
}

export type SeoHeadOptions = {
  title: string;
  description: string;
  /** Path below the site root, e.g. "/pricing". Used for the
   *  canonical URL and og:url. */
  path: string;
  /** Defaults to `title`. */
  ogTitle?: string;
  /** Defaults to `description`. */
  ogDescription?: string;
  /** Defaults to "website". */
  ogType?: string;
  /** Defaults to the repo-owned share image. */
  ogImage?: string;
};

/**
 * Standard head tags for a public page: unique title and description,
 * canonical URL, and Open Graph + Twitter Card tags. Pass the page's
 * existing title/description strings — this helper only adds the
 * tags that were missing, it never rewrites page copy.
 */
export function seoHead({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
}: SeoHeadOptions) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle ?? title },
      { property: "og:description", content: ogDescription ?? description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: ogTitle ?? title },
      { name: "twitter:description", content: ogDescription ?? description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
