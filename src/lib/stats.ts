import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ViewRow = { created_at: string; source: string | null };
export type EventRow = { created_at: string; link_id: string; source: string | null };

/**
 * Dashboard stats — one shared query for Overview and Analytics so
 * their numbers always agree. The fetch itself is limited to the
 * plan's analytics window (Free 7 days, Pro 30) — a Free account's
 * browser never receives the older rows; each page then applies the
 * same window for display. (The all-time views count is separate
 * and not windowed.)
 *
 * link_clicks rows are split by kind (Step 04): "product_view" is a
 * customer opening a product's details; everything else is a WhatsApp
 * order/book click — the only kind recorded before Step 04. A
 * WhatsApp click means the button was tapped; it does NOT confirm an
 * order, and nothing here is labelled as sales or revenue.
 *
 * The selects tolerate the pre-0007 schema: if the source/kind
 * columns are not in the database yet, the query retries without
 * them (sources read as null, clicks as WhatsApp clicks).
 */
export const statsQuery = (uid: string, isPro: boolean) =>
  queryOptions({
    queryKey: ["stats", uid, isPro ? 30 : 7],
    queryFn: async () => {
      const since = new Date(Date.now() - (isPro ? 30 : 7) * 864e5).toISOString();
      const [views, events, tv] = await Promise.all([
        fetchViews(uid, since),
        fetchEvents(uid, since),
        supabase.from("page_views").select("id", { count: "exact", head: true }).eq("profile_id", uid),
      ]);
      return {
        views,
        productViews: events.filter((e) => e.kind === "product_view"),
        whatsappClicks: events.filter((e) => e.kind !== "product_view"),
        totalViews: tv.count ?? 0,
      };
    },
  });

async function fetchViews(uid: string, since: string): Promise<ViewRow[]> {
  const full = await supabase
    .from("page_views")
    .select("created_at, source")
    .eq("profile_id", uid)
    .gte("created_at", since)
    .limit(10000);
  if (!full.error) return (full.data ?? []).map((r) => ({ created_at: r.created_at, source: r.source ?? null }));
  const bare = await supabase
    .from("page_views")
    .select("created_at")
    .eq("profile_id", uid)
    .gte("created_at", since)
    .limit(10000);
  return (bare.data ?? []).map((r) => ({ created_at: r.created_at, source: null }));
}

async function fetchEvents(uid: string, since: string): Promise<(EventRow & { kind: string })[]> {
  const full = await supabase
    .from("link_clicks")
    .select("created_at, link_id, kind, source")
    .eq("profile_id", uid)
    .gte("created_at", since)
    .limit(10000);
  if (!full.error)
    return (full.data ?? []).map((r) => ({
      created_at: r.created_at,
      link_id: r.link_id,
      kind: r.kind ?? "whatsapp_click",
      source: r.source ?? null,
    }));
  const bare = await supabase
    .from("link_clicks")
    .select("created_at, link_id")
    .eq("profile_id", uid)
    .gte("created_at", since)
    .limit(10000);
  return (bare.data ?? []).map((r) => ({
    created_at: r.created_at,
    link_id: r.link_id,
    kind: "whatsapp_click",
    source: null,
  }));
}
