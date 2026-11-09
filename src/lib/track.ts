import { supabase } from "@/integrations/supabase/client";
import { deriveSource } from "@/lib/source";

/**
 * Storefront event tracking (Step 04). Events live in the two existing
 * tables — no new analytics system:
 *
 * - Shop view      → page_views (one row per shop per browser session)
 * - Product view   → link_clicks with kind = "product_view" (a customer
 *                    opened the product's details; one row per product
 *                    per browser session)
 * - WhatsApp click → link_clicks with kind = "whatsapp_click" (a tap on
 *                    a product's Order/Book on WhatsApp button — the
 *                    only thing link_clicks ever recorded before
 *                    Step 04, which is why the 0007 migration defaults
 *                    existing rows to that kind)
 *
 * Rules: the shop owner is never counted (when the signed-in viewer is
 * the owner, nothing is recorded); every event carries the session's
 * source label (see lib/source.ts); tracking is fire-and-forget and
 * must never break or slow the storefront.
 *
 * Pre-0007 tolerance: inserts that name the source/kind columns fail
 * while the migration is unapplied. Shop views and WhatsApp clicks
 * then retry WITHOUT those columns, so the pre-Step-04 counting keeps
 * working. Product views do NOT retry — a row without its kind would
 * be indistinguishable from a WhatsApp click and would corrupt the
 * click numbers, so it is skipped until the migration lands.
 */

function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* private mode etc. — dedupe just becomes best-effort */
  }
}

/**
 * The source label for this browser session's visit to this shop.
 * Derived once (link params, then referrer) and stashed, so every
 * event in the session is attributed the same way.
 */
export function captureSessionSource(profileId: string): string {
  const key = `izzy:source:${profileId}`;
  const stashed = sessionGet(key);
  if (stashed) return stashed;
  let source = "direct";
  try {
    const params = new URLSearchParams(window.location.search);
    source = deriveSource({
      src: params.get("src"),
      utmSource: params.get("utm_source"),
      referrer: document.referrer,
      ownHost: window.location.hostname,
    });
  } catch {
    /* keep "direct" */
  }
  sessionSet(key, source);
  return source;
}

async function isOwner(profileId: string): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session && data.session.user.id === profileId;
  } catch {
    return false;
  }
}

export function trackShopView(profileId: string): void {
  void (async () => {
    try {
      const key = `izzy:viewed:${profileId}`;
      if (sessionGet(key)) return; // refreshes within a session count once
      if (await isOwner(profileId)) return;
      sessionSet(key, "1");
      const source = captureSessionSource(profileId);
      const { error } = await supabase.from("page_views").insert({ profile_id: profileId, source });
      if (error) await supabase.from("page_views").insert({ profile_id: profileId });
    } catch {
      /* tracking must never break the storefront */
    }
  })();
}

export function trackProductView(profileId: string, linkId: string): void {
  void (async () => {
    try {
      const key = `izzy:pview:${profileId}:${linkId}`;
      if (sessionGet(key)) return; // one product view per product per session
      if (await isOwner(profileId)) return;
      sessionSet(key, "1");
      const source = captureSessionSource(profileId);
      // No fallback insert — see the module comment.
      await supabase
        .from("link_clicks")
        .insert({ link_id: linkId, profile_id: profileId, kind: "product_view", source });
    } catch {
      /* tracking must never break the storefront */
    }
  })();
}

export function trackWhatsappClick(profileId: string, linkId: string): void {
  void (async () => {
    try {
      if (await isOwner(profileId)) return;
      const source = captureSessionSource(profileId);
      const { error } = await supabase
        .from("link_clicks")
        .insert({ link_id: linkId, profile_id: profileId, kind: "whatsapp_click", source });
      if (error) await supabase.from("link_clicks").insert({ link_id: linkId, profile_id: profileId });
    } catch {
      /* tracking must never break the storefront */
    }
  })();
}
