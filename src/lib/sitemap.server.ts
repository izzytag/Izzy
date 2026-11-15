/**
 * Dynamic sitemap data: the usernames of every published shop.
 *
 * Visibility follows getPublicPage exactly: the query runs with the
 * publishable key, so RLS applies and only username-set profiles are
 * ever returned. Never the service-role client here — the sitemap
 * must only ever list shops a visitor could already open.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isSitemapEligibleUsername } from "./seo";

/**
 * Publishable-key client. Mirrors publicClient() in
 * public-page.functions.ts, including the new-format API key
 * workaround (opaque sb_ keys are not bearer JWTs).
 */
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ShopUsernameRow = { username: string | null; suspended: boolean | null };

/**
 * One page of shop usernames, ordered by username so paging is
 * stable (usernames are unique). Minimal columns only: username
 * plus the suspended flag, so suspended shops stay out of the
 * sitemap. If the `suspended` column is missing — a fresh
 * environment where migration 0008 has not run — retry with the
 * username alone, mirroring the getPublicPage fallback: a missing
 * optional column must never take the sitemap down.
 */
export async function queryShopUsernamePage(from: number, to: number): Promise<ShopUsernameRow[]> {
  const sb = publicClient();
  const withFlag = await sb
    .from("profiles")
    .select("username, suspended")
    .not("username", "is", null)
    .order("username")
    .range(from, to);
  if (!withFlag.error) return withFlag.data ?? [];
  const bare = await sb
    .from("profiles")
    .select("username")
    .not("username", "is", null)
    .order("username")
    .range(from, to);
  if (bare.error) throw new Error(`sitemap profiles query failed: ${bare.error.message}`);
  return (bare.data ?? []).map((r) => ({ username: r.username, suspended: false }));
}

const SITEMAP_PAGE_SIZE = 1000;
/** Sitemap protocol limit: at most 50,000 URLs per sitemap file. */
const SITEMAP_MAX_URLS = 50000;

/**
 * Every published shop username, paged through in minimal-column
 * queries. Suspended shops, unset usernames, invalid formats and
 * route-colliding names are filtered out; duplicates are dropped.
 * `fetchPage` is injectable so paging and filtering stay testable
 * without a database.
 */
export async function listShopUsernames(
  fetchPage: (from: number, to: number) => Promise<ShopUsernameRow[]> = queryShopUsernamePage,
  opts: { pageSize?: number; maxUrls?: number } = {},
): Promise<string[]> {
  const pageSize = opts.pageSize ?? SITEMAP_PAGE_SIZE;
  const maxUrls = opts.maxUrls ?? SITEMAP_MAX_URLS;
  const seen = new Set<string>();
  const usernames: string[] = [];
  let from = 0;
  for (;;) {
    const rows = await fetchPage(from, from + pageSize - 1);
    for (const row of rows) {
      if (row.suspended) continue;
      const username = row.username;
      if (!isSitemapEligibleUsername(username)) continue;
      if (seen.has(username)) continue;
      seen.add(username);
      usernames.push(username);
      if (usernames.length >= maxUrls) return usernames;
    }
    if (rows.length < pageSize) return usernames;
    from += pageSize;
  }
}
