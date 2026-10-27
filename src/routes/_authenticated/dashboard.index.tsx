import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Plus, Download, Copy, Camera, Pencil, Check, QrCode, ShoppingBag, Briefcase } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, effectiveTheme, FREE_LINK_LIMIT, normalizeUrl } from "@/lib/themes";
import { TESTING_FREE, TESTING_BANNER, PRO_PRICE_DISPLAY_LINE, effectiveIsPro } from "@/lib/billing";
import { getPageMode } from "@/lib/page-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PhonePreview } from "@/components/PhonePreview";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: LinksPage,
});

type LinkRow = Tables<"links">;

function LinksPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const [name, setName] = useState(p.display_name ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [avatar, setAvatar] = useState(p.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);
  const pro = effectiveIsPro(acc.isPro);
  const shopUrl = `${pageUrl}/shop`;

  const setLinks = (fn: (l: LinkRow[]) => LinkRow[]) => qc.setQueryData(linksQuery(acc.user.id).queryKey, (old) => fn(old ?? []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0, 60), bio: bio.slice(0, 160) }).eq("id", acc.user.id);
    if (error) return void toast.error(error.message);
    toast.success("Profile saved");
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
    toast.success("Photo updated");
  }

  // Exclusive page modes, derived from enabled rows: a page is either
  // links OR shop/services, never both. Nothing is deleted to enforce this.
  const pageMode = getPageMode(links);
  const hiddenLinks = pageMode === "shop" ? links.filter((l) => l.enabled && l.kind === "link") : [];

  async function addLink(kind: "link" | "product" | "service" = "link") {
    if (kind === "link" && pageMode === "shop") return void toast.error("Your page is a store/service page, so links are not shown here. Remove all products and services first if you want a link page instead.");
    if (kind !== "link" && pageMode === "links") return void toast.error("Your page is a link page, so shop products and services are not shown here. Remove all links first if you want a store/service page instead.");
    // NOTE: TESTING_FREE does not lift this check — the Supabase
    // enforce_link_limit trigger still caps free accounts at 5 links.
    if (!canAddLink(links.length, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited.`);
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind, title: kind === "link" ? "New link" : kind === "product" ? "New product" : "New service", url: kind === "link" ? "https://" : "", position: links.length }).select().single();
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
    const oldI = links.findIndex((l) => l.id === e.active.id);
    const newI = links.findIndex((l) => l.id === e.over!.id);
    const next = arrayMove(links, oldI, newI).map((l, i) => ({ ...l, position: i }));
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
    ...p, display_name: name, bio, avatar_url: avatar,
    socials: (p.socials as Record<string, string>) ?? {},
    links: links.filter((l) => l.enabled && (l.kind !== "link" || l.url.length > 8)),
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

        {/* Profile */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="mt-4 flex items-start gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload photo">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
              <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            <div className="flex-1 space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name or business" maxLength={60} />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (160 characters)" maxLength={160} rows={2} />
              <Button size="sm" onClick={saveProfile}>Save profile</Button>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Links</h2>
            {!acc.isPro && <span className="text-xs text-muted-foreground">{links.length}/{FREE_LINK_LIMIT} on Free</span>}
          </div>
          {pageMode === "empty" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">A page is either links OR shop and services, not both. The first item you add sets the mode.</p>
          )}
          {pageMode === "shop" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">Your page is a store/service page, so links are not shown here. Remove all products and services first if you want a link page instead.</p>
          )}
          {pageMode === "links" && (
            <p className="mt-4 rounded-xl border p-3 text-base text-muted-foreground">Your page is a link page, so shop products and services are not shown here. Remove all links first if you want a store/service page instead.</p>
          )}
          {hiddenLinks.length > 0 && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-base text-accent-foreground">Your {hiddenLinks.length === 1 ? "link is" : "links are"} saved but hidden from visitors while your page is a store/service page. {hiddenLinks.length === 1 ? "It" : "They"} will show again if you remove all products and services, or you can delete {hiddenLinks.length === 1 ? "it" : "them"} below.</p>
          )}
          <Button onClick={() => addLink()} disabled={pageMode === "shop"} className="mt-4 min-h-[52px] w-full rounded-full text-lg"><Plus className="h-5 w-5" /> Add link</Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => addLink("product")} disabled={pageMode === "links"} className="min-h-[48px] rounded-full text-base"><ShoppingBag className="h-4 w-4" /> Shop product</Button>
            <Button variant="outline" onClick={() => addLink("service")} disabled={pageMode === "links"} className="min-h-[48px] rounded-full text-base"><Briefcase className="h-4 w-4" /> Service</Button>
          </div>
          {pageMode !== "links" && (
            <div className="mt-3 rounded-xl border p-3">
              <p className="text-base font-semibold">Shop products</p>
              <p className="mt-1 text-base text-muted-foreground">Products you add here also appear on your shop page. Services appear on your main page.</p>
              <p className="mt-2 truncate text-base font-medium text-primary">{shopUrl.replace(/^https?:\/\//, "")}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" asChild><a href={shopUrl} target="_blank" rel="noreferrer">View my Shop</a></Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shopUrl); toast.success("Shop link copied"); }}><Copy className="h-4 w-4" /> Copy shop link</Button>
              </div>
            </div>
          )}
          {!p.whatsapp && links.some((l) => l.kind !== "link") && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              Add your WhatsApp number in <Link to="/dashboard/appearance" className="font-semibold underline">Appearance</Link> so visitors can order or book on WhatsApp.
            </p>
          )}
          {!canAddLink(links.length, acc.isPro) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              You've used all {FREE_LINK_LIMIT} free links. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({PRO_PRICE_DISPLAY_LINE})</Link> for unlimited links.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-4 space-y-3">
                {links.map((l) => <LinkItem key={l.id} link={l} onUpdate={updateLink} onDelete={deleteLink} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {links.length === 0 && <p className="mt-6 text-center text-base text-muted-foreground">Add your first item — a link, a shop product, or a service.</p>}
        </section>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
      </aside>
    </div>
  );
}

function LinkItem({ link, onUpdate, onDelete }: { link: LinkRow; onUpdate: (id: string, p: Partial<LinkRow>) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const isCard = link.kind !== "link";
  const [editing, setEditing] = useState(isCard ? link.title.startsWith("New ") : link.url === "https://");
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [price, setPrice] = useState(link.price ?? "");
  const [desc, setDesc] = useState(link.description ?? "");

  function save() {
    if (isCard) {
      if (!title.trim()) return void toast.error("Add a title");
      onUpdate(link.id, { title: title.trim().slice(0, 80), price: price.trim().slice(0, 30) || null, description: desc.trim().slice(0, 200) || null });
      return void setEditing(false);
    }
    if (!title.trim() || url.trim().length < 4) return void toast.error("Add a title and a URL");
    onUpdate(link.id, { title: title.trim().slice(0, 80), url: normalizeUrl(url) });
    setEditing(false);
  }

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-2xl border bg-background p-4 ${isDragging ? "z-10 shadow-soft" : ""}`}>
      <button {...attributes} {...listeners} className="mt-2 cursor-grab touch-none text-muted-foreground" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            {isCard ? (
              <>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={link.kind === "service" ? "Fee, e.g. ₹500 / session" : "Price, e.g. ₹499"} maxLength={30} />
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description (optional)" maxLength={200} rows={2} />
              </>
            ) : (
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" />
            )}
            <Button size="sm" onClick={save}><Check className="h-4 w-4" /> Save</Button>
          </div>
        ) : (
          <button className="block w-full text-left" onClick={() => setEditing(true)}>
            <p className="flex items-center gap-1.5 truncate font-semibold">{link.title} <Pencil className="h-3.5 w-3.5 text-muted-foreground" /></p>
            <p className="truncate text-sm text-muted-foreground">{isCard ? `${link.kind === "service" ? "Service" : "Product"}${link.price ? ` · ${link.price}` : ""} · WhatsApp button` : link.url}</p>
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Switch checked={link.enabled} onCheckedChange={(v) => onUpdate(link.id, { enabled: v })} aria-label="Show link" />
        <button onClick={() => onDelete(link.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete link"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}
