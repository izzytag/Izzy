import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

/**
 * Public storefront data: the profile plus its ENABLED products and
 * services, in position order. Izzy is shop/catalog only — link-kind
 * rows (legacy data, kept in the DB) are never returned here, so they
 * never appear on the public page.
 */
export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((d: { username: string }) => ({ username: String(d.username).toLowerCase().slice(0, 30) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // The full select includes the Step 02/06 columns (category,
    // suspended). If they are missing — e.g. a fresh environment where
    // migrations 0006/0008 have not run — PostgREST errors the whole
    // query, which would 404 every shop. Mirror the stats.ts pattern:
    // retry with the pre-0006/0008 column set and treat the missing
    // fields as category=null, suspended=false. A missing optional
    // column must never take every storefront down.
    const full = await sb
      .from("profiles")
      .select("id, username, display_name, bio, category, avatar_url, theme, socials, whatsapp, upi_id, suspended")
      .eq("username", data.username)
      .maybeSingle();
    type ProfileRow = NonNullable<typeof full.data>;
    let profile: ProfileRow | null = full.data;
    if (full.error) {
      const bare = await sb
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, theme, socials, whatsapp, upi_id")
        .eq("username", data.username)
        .maybeSingle();
      if (bare.data) profile = { ...bare.data, category: null, suspended: false } as ProfileRow;
    }
    if (!profile) return null;
    // Suspended shops (Step 06) render as unavailable: no products, no
    // WhatsApp, no tracking — just the state. Only the flag leaves the
    // server; none of the shop's data is returned.
    if (profile.suspended) {
      return { suspended: true as const, username: profile.username, displayName: profile.display_name };
    }
    const [{ data: links }, { data: isPro }] = await Promise.all([
      sb.from("links").select("id, title, url, kind, price, description, image_urls, category").eq("user_id", profile.id).eq("enabled", true).in("kind", ["product", "service"]).order("position"),
      sb.rpc("is_pro", { _uid: profile.id }),
    ]);
    return { suspended: false as const, profile, links: links ?? [], isPro: !!isPro };
  });
