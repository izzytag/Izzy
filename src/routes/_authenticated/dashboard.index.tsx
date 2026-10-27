import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Download, Copy, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, effectiveTheme, FREE_LINK_LIMIT } from "@/lib/themes";
import { TESTING_FREE, TESTING_BANNER, PRO_PRICE_DISPLAY_LINE, effectiveIsPro } from "@/lib/billing";
import { getPageMode } from "@/lib/page-mode";
import { Button } from "@/components/ui/button";
import { PhonePreview } from "@/components/PhonePreview";
import { DashboardLinkItem, reorderSubset, type LinkRow } from "@/components/DashboardLinkItem";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: LinksPage,
});

/**
 * Links tab only. The store (name, logo, bio, products, services) lives
 * on the separate Store tab — there is no store card on this page.
 * Exclusive page modes still apply: in shop mode, adding links is
 * disabled and any saved links are shown as hidden, never deleted.
 */
function LinksPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const qrRef = useRef<HTMLDivElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);
  const pro = effectiveIsPro(acc.isPro);

  const setLinks = (fn: (l: LinkRow[]) => LinkRow[]) => qc.setQueryData(linksQuery(acc.user.id).queryKey, (old) => fn(old ?? []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  // Exclusive page modes, derived from enabled rows: a page is either
  // links OR shop/services, never both. Nothing is deleted to enforce this.
  const pageMode = getPageMode(links);
  const linkRows = links.filter((l) => l.kind === "link");
  const hiddenLinks = pageMode === "shop" ? links.filter((l) => l.enabled && l.kind === "link") : [];

  async function addLink() {
    if (pageMode === "shop") return void toast.error("Your page is a store/service page, so links are not shown here. Remove all products and services first if you want a link page instead.");
    // NOTE: TESTING_FREE does not lift this check — the Supabase
    // enforce_link_limit trigger still caps free accounts at 5 links.
    if (!canAddLink(links.length, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited.`);
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind: "link", title: "New link", url: "https://", position: links.length }).select().single();
    if (error) return void toast.error(error.message);
    setLinks((l) => [...l, data]);
  }

  async function updateLink(id: string, patch: Partial<LinkRow>) {
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function deleteLink(id: string) {
    setLinks((l) => l.filter((x) => x.id !== id));
    await supabase.from("links").delete().eq("id", id);
  }

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const next = reorderSubset(links, linkRows, String(e.active.id), String(e.over.id));
    if (!next) return;
    setLinks(() => next);
    await Promise.all(next.map((l) => supabase.from("links").update({ position: l.position }).eq("id", l.id)));
  }

  function downloadQR() {
    try {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) throw new Error("QR code not ready yet");
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `izzy-${p.username}-qr.png`;
      a.click();
      toast.success("QR code downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't download the QR code. Please try again.");
    }
  }

  const preview = {
    ...p,
    socials: (p.socials as Record<string, string>) ?? {},
    links: links.filter((l) => l.enabled && l.kind === "link" && l.url.length > 8),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {TESTING_FREE && (
          <p className="rounded-3xl border bg-primary-soft p-4 text-base font-medium text-accent-foreground">{TESTING_BANNER}</p>
        )}
        {/* Share */}
        <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your page</p>
            <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="block truncate font-display text-lg font-bold text-primary">{pageUrl.replace(/^https?:\/\//, "")}</a>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Link copied"); }}><Copy className="h-4 w-4" /> Copy</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><QrCode className="h-4 w-4" /> QR code</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Your page QR code</DialogTitle>
                  <DialogDescription>Scan to open your Izzy page.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-2">
                  <div ref={qrRef} className="rounded-2xl border bg-card p-4">
                    <QRCodeCanvas value={pageUrl} size={1024} marginSize={4} style={{ width: 224, height: 224 }} />
                  </div>
                  <p className="w-full truncate text-center text-sm font-medium text-muted-foreground">{pageUrl.replace(/^https?:\/\//, "")}</p>
                  <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Link copied"); }}>
                    <Copy className="h-4 w-4" /> Copy link
                  </Button>
                  {pro ? (
                    <Button className="w-full" onClick={downloadQR}><Download className="h-4 w-4" /> Download PNG</Button>
                  ) : (
                    <div className="w-full rounded-xl bg-primary-soft p-3 text-center text-sm text-accent-foreground">
                      Download is a Pro feature — <Link to="/dashboard/upgrade" className="font-semibold underline">Upgrade ({PRO_PRICE_DISPLAY_LINE})</Link>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Links */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Links</h2>
            {!acc.isPro && <span className="text-xs text-muted-foreground">{linkRows.length}/{FREE_LINK_LIMIT} on Free</span>}
          </div>
          {pageMode === "empty" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">A page is either links OR shop and services, not both. The first item you add sets the mode. Your store lives on the Store tab.</p>
          )}
          {pageMode === "shop" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">Your page is a store/service page, so links are not shown here. Remove all products and services first if you want a link page instead.</p>
          )}
          {pageMode === "links" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">Your page is a link page, so shop products and services are not shown here. Remove all links first if you want a store/service page instead. Your store lives on the Store tab.</p>
          )}
          {hiddenLinks.length > 0 && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-base text-accent-foreground">Your {hiddenLinks.length === 1 ? "link is" : "links are"} saved but hidden from visitors while your page is a store/service page. {hiddenLinks.length === 1 ? "It" : "They"} will show again if you remove all products and services, or you can delete {hiddenLinks.length === 1 ? "it" : "them"} below.</p>
          )}
          <Button onClick={() => addLink()} disabled={pageMode === "shop"} className="mt-4 min-h-[52px] w-full rounded-full text-lg"><Plus className="h-5 w-5" /> Add link</Button>
          {!canAddLink(links.length, acc.isPro) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              You've used all {FREE_LINK_LIMIT} free links. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({PRO_PRICE_DISPLAY_LINE})</Link> for unlimited links.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={linkRows.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-4 space-y-3">
                {linkRows.map((l) => <DashboardLinkItem key={l.id} link={l} onUpdate={updateLink} onDelete={deleteLink} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {linkRows.length === 0 && <p className="mt-6 text-center text-base text-muted-foreground">No links yet. Add your first link above — or head to the Store tab to build a store instead.</p>}
        </section>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
      </aside>
    </div>
  );
}
