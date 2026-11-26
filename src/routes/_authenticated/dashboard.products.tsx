import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Search } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, FREE_LINK_LIMIT } from "@/lib/themes";
import { isCatalogueProduct } from "@/lib/catalogue";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLinkItem, reorderSubset, type LinkRow } from "@/components/DashboardLinkItem";
import { hasOptionFields, isMissingOptionColumnError, withoutOptionFields } from "@/lib/product-categories";

import { DashboardLoading } from "@/components/DashboardLoading";

export const Route = createFileRoute("/_authenticated/dashboard/products")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  pendingComponent: DashboardLoading,
  component: ProductsPage,
});

/**
 * Products — the catalogue manager. Products show as Home-style
 * photo cards (2-column grid on phone, name + price) with a
 * Live/Hidden toggle on each card; tapping a card opens its edit
 * form full-width. New items start as drafts (switched off),
 * photos are processed on upload, ordering is drag-and-drop, and
 * the free-plan item limit counts product rows only (legacy link
 * rows are never shown here).
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

  const storeRows = links.filter(isCatalogueProduct);
  const itemCount = storeRows.length;
  const liveCount = storeRows.filter((l) => l.enabled).length;
  // Search (by title) and the Live/Drafts filter combine; both run over
  // the already-loaded rows, so there is nothing extra to fetch.
  const q = query.trim().toLowerCase();
  const visibleRows = storeRows.filter((l) =>
    (statusFilter === "all" || (statusFilter === "live" ? l.enabled : !l.enabled)) &&
    (!q || l.title.toLowerCase().includes(q)),
  );

  async function addItem() {
    // The free-item limit is enforced by this UI check (the database
    // trigger currently enforces no limit). If a server-side limit is
    // ever added, its error is still translated below — the raw
    // database message is never shown to the seller.
    if (!canAddLink(itemCount, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} items. Upgrade to Pro for unlimited.`);
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind: "product", title: "New product", url: "", position: links.length, enabled: false }).select().single();
    if (error) {
      const hitLimit = /limit|maximum|free plan/i.test(error.message);
      return void toast.error(hitLimit
        ? `You've reached the free plan limit of ${FREE_LINK_LIMIT} items. Upgrade to Pro for unlimited items.`
        : "Couldn't add that item — please try again.");
    }
    // Clear any search/filter so the new draft is visible in edit mode.
    setQuery("");
    setStatusFilter("all");
    setJustCreatedId(data.id);
    setLinks((l) => [...l, data]);
  }

  async function updateLink(id: string, patch: Partial<LinkRow>) {
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (!error) return;
    // Before migration 0011 is applied, option_label/options do not
    // exist yet. Retry without them so the rest of the product still
    // saves, and tell the seller plainly what did not save.
    if (hasOptionFields(patch as Record<string, unknown>) && isMissingOptionColumnError(error)) {
      const fallback = withoutOptionFields(patch as Record<string, unknown>) as Partial<LinkRow>;
      const retry = await supabase.from("links").update(fallback).eq("id", id);
      if (!retry.error) {
        toast.error("Product saved. Options need a database update before they can save — ask for migration 0011 to be applied.");
        return;
      }
      toast.error(retry.error.message);
      return;
    }
    toast.error(error.message);
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
        <Button onClick={() => addItem()} className="min-h-[52px] w-full text-base font-semibold"><ShoppingBag className="h-4 w-4" /> Add product</Button>
        {!p.whatsapp && storeRows.some((l) => l.enabled) && (
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
            Add your WhatsApp number in <Link to="/dashboard/store" className="font-semibold underline">My Shop</Link>, so visitors can order on WhatsApp.
          </p>
        )}
        {!canAddLink(itemCount, acc.isPro) && (
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
            You've used all {FREE_LINK_LIMIT} free items. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({proPriceLine(region)})</Link> for unlimited items.
          </p>
        )}
        {storeRows.length > 0 && liveCount === 0 && (
          <div className="mt-3 rounded-xl border-2 border-primary/30 bg-primary-soft p-4" role="status">
            <p className="font-semibold text-accent-foreground">Your shop is not published yet</p>
            <p className="mt-1 text-sm leading-relaxed text-accent-foreground/80">
              All items below are drafts, and visitors see an empty shop. Switch on your first item to publish it.
            </p>
            <Button
              className="mt-3 min-h-[44px]"
              onClick={() => {
                const first = storeRows[0];
                if (first) {
                  void updateLink(first.id, { enabled: true });
                  toast.success(`"${first.title}" is now live on your shop`);
                }
              }}
            >
              Switch on your first item
            </Button>
          </div>
        )}
        {storeRows.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" className="pl-9" />
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
          <SortableContext items={visibleRows.map((l) => l.id)} strategy={rectSortingStrategy}>
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
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
            <p className="text-base text-muted-foreground">No products yet.</p>
            <p className="mx-auto mt-1 max-w-md text-base text-muted-foreground">Add your first product above — it starts switched off, so you can add its photo and price before anyone sees it.</p>
          </div>
        )}
      </section>
    </div>
  );
}
