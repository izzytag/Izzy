import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Briefcase, Search } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, FREE_LINK_LIMIT } from "@/lib/themes";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLinkItem, reorderSubset, type LinkRow } from "@/components/DashboardLinkItem";

export const Route = createFileRoute("/_authenticated/dashboard/products")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: ProductsPage,
});

/**
 * Products — the catalogue manager. This is the product/service half
 * of the old combined Store tab, relocated unchanged: new items start
 * as drafts (switched off), photos are processed on upload, ordering
 * is drag-and-drop, and the free-plan item limit counts product and
 * service rows only (legacy link rows are never shown here).
 */
function ProductsPage() {
  const region = useRegion();
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "drafts">("all");

  const setLinks = (fn: (l: LinkRow[]) => LinkRow[]) => qc.setQueryData(linksQuery(acc.user.id).queryKey, (old) => fn(old ?? []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  const storeRows = links.filter((l) => l.kind !== "link");
  const itemCount = storeRows.length;
  const liveCount = storeRows.filter((l) => l.enabled).length;
  // Search (by title) and the Live/Drafts filter combine; both run over
  // the already-loaded rows, so there is nothing extra to fetch.
  const q = query.trim().toLowerCase();
  const visibleRows = storeRows.filter((l) =>
    (statusFilter === "all" || (statusFilter === "live" ? l.enabled : !l.enabled)) &&
    (!q || l.title.toLowerCase().includes(q)),
  );

  async function addItem(kind: "product" | "service") {
    // NOTE: the enforce_link_limit trigger counts ALL of the user's
    // rows (including legacy link rows), so a free user whose old
    // link rows fill the quota can still be refused by the database
    // even when this UI count has room — the trigger's message is
    // what the toast below then shows.
    if (!canAddLink(itemCount, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} items. Upgrade to Pro for unlimited.`);
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind, title: kind === "product" ? "New product" : "New service", url: "", position: links.length, enabled: false }).select().single();
    if (error) return void toast.error(error.message);
    // Clear any search/filter so the new draft is visible in edit mode.
    setQuery("");
    setStatusFilter("all");
    setJustCreatedId(data.id);
    setLinks((l) => [...l, data]);
  }

  async function updateLink(id: string, patch: Partial<LinkRow>) {
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function deleteLink(id: string) {
    setLinks((l) => l.filter((x) => x.id !== id));
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      // The optimistic removal was wrong — tell the seller and pull
      // the real list back instead of silently diverging.
      toast.error(error.message);
      void qc.invalidateQueries({ queryKey: linksQuery(acc.user.id).queryKey });
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    // Reorder within the currently visible rows: hidden rows keep
    // their slots, so dragging while searching/filtering is safe.
    const next = reorderSubset(links, visibleRows, String(e.active.id), String(e.over.id));
    if (!next) return;
    setLinks(() => next);
    const results = await Promise.all(next.map((l) => supabase.from("links").update({ position: l.position }).eq("id", l.id)));
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(failed.error.message);
      void qc.invalidateQueries({ queryKey: linksQuery(acc.user.id).queryKey });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Products</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Everything you add appears on your shop page. {acc.isPro ? `${itemCount} items.` : `${itemCount} of ${FREE_LINK_LIMIT} free items used.`}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => addItem("product")} className="min-h-[48px] text-base"><ShoppingBag className="h-4 w-4" /> Shop product</Button>
          <Button variant="outline" onClick={() => addItem("service")} className="min-h-[48px] text-base"><Briefcase className="h-4 w-4" /> Service</Button>
        </div>
        {!p.whatsapp && storeRows.some((l) => l.enabled) && (
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
            Add your WhatsApp number in <Link to="/dashboard/store" className="font-semibold underline">My Shop</Link>, so visitors can order or book on WhatsApp.
          </p>
        )}
        {!canAddLink(itemCount, acc.isPro) && (
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
            You've used all {FREE_LINK_LIMIT} free items. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({proPriceLine(region)})</Link> for unlimited items.
          </p>
        )}
        {storeRows.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products and services" aria-label="Search products and services" className="pl-9" />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter by availability">
              {([["all", `All (${itemCount})`], ["live", `Live (${liveCount})`], ["drafts", `Drafts (${itemCount - liveCount})`]] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setStatusFilter(key)} aria-pressed={statusFilter === key}
                  className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold transition ${statusFilter === key ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleRows.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {visibleRows.map((l) => <DashboardLinkItem key={l.id} link={l} onUpdate={updateLink} onDelete={deleteLink} userId={acc.user.id} justCreated={l.id === justCreatedId} hasWhatsApp={Boolean(p.whatsapp)} />)}
            </ul>
          </SortableContext>
        </DndContext>
        {storeRows.length > 0 && visibleRows.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-base text-muted-foreground">No products match your search.</p>
            <p className="mx-auto mt-1 max-w-md text-base text-muted-foreground">Try a different name, or clear the search and filter to see everything.</p>
            <Button variant="outline" className="mt-3" onClick={() => { setQuery(""); setStatusFilter("all"); }}>Clear search &amp; filter</Button>
          </div>
        )}
        {storeRows.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-base text-muted-foreground">No products or services yet.</p>
            <p className="mx-auto mt-1 max-w-md text-base text-muted-foreground">Add your first product above — it starts switched off, so you can add its photo and price before anyone sees it.</p>
          </div>
        )}
      </section>
    </div>
  );
}
