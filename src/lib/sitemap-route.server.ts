/**
 * Thin HTTP adapter for the dynamic sitemap. Kept separate from the
 * data fetching so the handler stays unit-testable without a
 * database or env — the same split as the Razorpay webhook adapter.
 *
 * Degrades gracefully: if the shop listing fails (database down,
 * env missing), the sitemap still returns 200 with the static
 * public routes. A sitemap must never 500 over a listing failure.
 */
import { STATIC_SITEMAP_PATHS, buildSitemapXml } from "./seo";
import { listShopUsernames } from "./sitemap.server";

export type SitemapDeps = { listUsernames: () => Promise<string[]> };

export const realSitemapDeps: SitemapDeps = {
  listUsernames: () => listShopUsernames(),
};

function sitemapResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Shops change slowly; an hour of caching keeps crawlers from
      // re-running the listing on every fetch.
      "cache-control": "public, max-age=3600",
    },
  });
}

export async function handleSitemapRequest(deps: SitemapDeps = realSitemapDeps): Promise<Response> {
  try {
    const usernames = await deps.listUsernames();
    return sitemapResponse(
      buildSitemapXml([...STATIC_SITEMAP_PATHS, ...usernames.map((u) => `/${u}`)]),
    );
  } catch (error) {
    console.error("sitemap: shop listing failed, serving static routes only", error);
    return sitemapResponse(buildSitemapXml([...STATIC_SITEMAP_PATHS]));
  }
}
