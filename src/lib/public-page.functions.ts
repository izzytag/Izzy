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

export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((d: { username: string }) => ({ username: String(d.username).toLowerCase().slice(0, 30) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: profile } = await sb
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, theme, socials, whatsapp, upi_id")
      .eq("username", data.username)
      .maybeSingle();
    if (!profile) return null;
    const [{ data: links }, { data: isPro }] = await Promise.all([
      sb.from("links").select("id, title, url, kind, price, description, image_urls, category").eq("user_id", profile.id).eq("enabled", true).order("position"),
      sb.rpc("is_pro", { _uid: profile.id }),
    ]);
    return { profile, links: links ?? [], isPro: !!isPro };
  });

/** Shop view: same profile, products only (kind='product', enabled). */
export const getPublicShop = createServerFn({ method: "GET" })
  .inputValidator((d: { username: string }) => ({ username: String(d.username).toLowerCase().slice(0, 30) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: profile } = await sb
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, theme, socials, whatsapp, upi_id")
      .eq("username", data.username)
      .maybeSingle();
    if (!profile) return null;
    const [{ data: products }, { data: isPro }] = await Promise.all([
      sb.from("links").select("id, title, url, kind, price, description, image_urls, category").eq("user_id", profile.id).eq("enabled", true).eq("kind", "product").order("position"),
      sb.rpc("is_pro", { _uid: profile.id }),
    ]);
    return { profile, products: products ?? [], isPro: !!isPro };
  });
