import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Camera, ShoppingBag, Briefcase } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, effectiveTheme, FREE_LINK_LIMIT } from "@/lib/themes";
import { TESTING_FREE, testingBanner, proPriceLine, effectiveIsPro } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { getPageMode } from "@/lib/page-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhonePreview } from "@/components/PhonePreview";
import { DashboardLinkItem, reorderSubset, type LinkRow } from "@/components/DashboardLinkItem";

export const Route = createFileRoute("/_authenticated/dashboard/store")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: StorePage,
});

/**
 * Store tab, separate from Links. This is the only place where the store
 * identity (name, logo, bio) and shop products/services are managed.
 * Exclusive page modes still apply: in links mode, products and services
 * cannot be added until all links are removed. Nothing is deleted here.
 */
function StorePage() {
  const region = useRegion();
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const [name, setName] = useState(p.display_name ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? "");
  const [avatar, setAvatar] = useState(p.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);
  const pro = effectiveIsPro(acc.isPro);
  const shopUrl = `${pageUrl}/shop`;

  const setLinks = (fn: (l: LinkRow[]) => LinkRow[]) => qc.setQueryData(linksQuery(acc.user.id).queryKey, (old) => fn(old ?? []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0, 60), bio: bio.slice(0, 160), whatsapp: whatsapp.trim() || null }).eq("id", acc.user.id);
    if (error) return void toast.error(error.message);
    toast.success("Store saved");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  async function uploadAvatar(f: File) {
    if (f.size > 2 * 1024 * 1024) return void toast.error("Image must be under 2MB");
    const path = `${acc.user.id}/avatar-${Date.now()}.${f.name.split(".").pop() || "jpg"}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true, contentType: f.type });
    if (error) return void toast.error(error.message);
    const { data: s } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!s) return;
    await supabase.from("profiles").update({ avatar_url: s.signedUrl }).eq("id", acc.user.id);
    setAvatar(s.signedUrl);
    qc.invalidateQueries({ queryKey: ["account"] });
    toast.success("Logo updated");
  }

  // Exclusive page modes, derived from enabled rows: a page is either
  // links OR shop/services, never both. Nothing is deleted to enforce this.
  const pageMode = getPageMode(links);
  const storeRows = links.filter((l) => l.kind !== "link");

  async function addItem(kind: "product" | "service") {
    if (pageMode === "links") return void toast.error("Your page is a link page, so shop products and services are not shown here. Remove all links first if you want a store/service page instead.");
    // NOTE: TESTING_FREE does not lift this check — the Supabase
    // enforce_link_limit trigger still caps free accounts at 5 links.
    if (!canAddLink(links.length, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited.`);
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind, title: kind === "product" ? "New product" : "New service", url: "", position: links.length }).select().single();
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
    const next = reorderSubset(links, storeRows, String(e.active.id), String(e.over.id));
    if (!next) return;
    setLinks(() => next);
    await Promise.all(next.map((l) => supabase.from("links").update({ position: l.position }).eq("id", l.id)));
  }

  const preview = {
    ...p, display_name: name, bio, avatar_url: avatar, whatsapp: whatsapp || null,
    socials: (p.socials as Record<string, string>) ?? {},
    links: links.filter((l) => l.enabled && l.kind !== "link"),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {TESTING_FREE && (
          <p className="rounded-3xl border bg-primary-soft p-4 text-base font-medium text-accent-foreground">{testingBanner(region)}</p>
        )}
        {/* Your store — store name, logo and bio, shown at the top of
            your store page. This is the only place these are edited. */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">Your store</h2>
          <p className="mt-1 text-base text-muted-foreground">Your store name and logo, shown at the top of your store page.</p>
          <div className="mt-4 flex items-start gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload store logo">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
              <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            <div className="flex-1 space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" maxLength={60} />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short store description (160 characters)" maxLength={160} rows={2} />
              <div className="space-y-1.5">
                <Label>WhatsApp number for orders</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="98765 43210" inputMode="tel" />
                <p className="text-xs text-muted-foreground">Visitors use this number to order on WhatsApp. The same number can also be changed in Appearance.</p>
              </div>
              <Button size="sm" onClick={saveProfile}>Save store</Button>
            </div>
          </div>
          <p className="mt-3 text-base text-muted-foreground">Logo is optional — if you skip it, we show your store initial instead.</p>
        </section>

        {/* Shop */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Shop products &amp; services</h2>
          </div>
          {pageMode === "links" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">Your page is currently a link page, so products cannot be added until all links are removed. Remove your links on the Links tab first if you want a store/service page instead.</p>
          )}
          {pageMode === "empty" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">A page is either links OR shop and services, not both. Adding a first product or service here makes this a store page.</p>
          )}
          {pageMode === "shop" && (
            <>
              <p className="mt-4 text-base text-muted-foreground">Products you add here appear on your store page. Services appear on your main page.</p>
              <p className="mt-2 truncate text-base font-medium text-primary">{shopUrl.replace(/^https?:\/\//, "")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild><a href={shopUrl} target="_blank" rel="noreferrer">View my Shop</a></Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shopUrl); toast.success("Shop link copied"); }}><Copy className="h-4 w-4" /> Copy shop link</Button>
              </div>
            </>
          )}
          {pageMode !== "links" && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => addItem("product")} className="min-h-[48px] rounded-full text-base"><ShoppingBag className="h-4 w-4" /> Shop product</Button>
              <Button variant="outline" onClick={() => addItem("service")} className="min-h-[48px] rounded-full text-base"><Briefcase className="h-4 w-4" /> Service</Button>
            </div>
          )}
          {!whatsapp && storeRows.some((l) => l.enabled) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              Add your WhatsApp number above, in Your store, so visitors can order or book on WhatsApp.
            </p>
          )}
          {pageMode !== "links" && !canAddLink(links.length, acc.isPro) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              You've used all {FREE_LINK_LIMIT} free links. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({proPriceLine(region)})</Link> for unlimited links.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={storeRows.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-4 space-y-3">
                {storeRows.map((l) => <DashboardLinkItem key={l.id} link={l} onUpdate={updateLink} onDelete={deleteLink} userId={acc.user.id} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {storeRows.length === 0 && pageMode !== "links" && <p className="mt-6 text-center text-base text-muted-foreground">No products or services yet. Add your first one above.</p>}
          {storeRows.length === 0 && pageMode === "links" && <p className="mt-6 text-center text-base text-muted-foreground">No products or services here yet — this page is a link page for now.</p>}
        </section>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
      </aside>
    </div>
  );
}
