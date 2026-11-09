import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Camera, ShoppingBag, Briefcase, Eye } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { canAddLink, effectiveTheme, FREE_LINK_LIMIT } from "@/lib/themes";
import { TESTING_FREE, testingBanner, proPriceLine, effectiveIsPro } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
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
 * Store tab — the dashboard home. This is the only place where the
 * store identity (name, logo, bio) and shop products/services are
 * managed. Izzy is shop/catalog only: new items start as drafts
 * (switched off), so nothing goes live half-made. Legacy link-kind
 * rows are filtered out of this tab entirely — they stay in the
 * database, just never displayed or edited.
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
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveNote, setSaveNote] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const lastSaved = useRef({ name: p.display_name ?? "", bio: p.bio ?? "", whatsapp: p.whatsapp ?? "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);
  const pro = effectiveIsPro(acc.isPro);

  const setLinks = (fn: (l: LinkRow[]) => LinkRow[]) => qc.setQueryData(linksQuery(acc.user.id).queryKey, (old) => fn(old ?? []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  // Store identity saves automatically when a field loses focus (the
  // Save button calls the same path). The WhatsApp number is normalised
  // to digits first: empty is fine, a bare 10-digit Indian number gets
  // the 91 country code, 11–15 digits are taken as already complete,
  // and anything else is an inline error that is never saved.
  function normalizeWhatsapp(raw: string): { value: string | null; prefixed?: string } | { error: string } {
    const digits = raw.replace(/\D/g, "");
    if (!raw.trim() || !digits) return { value: null };
    if (digits.length === 10) return { value: `91${digits}`, prefixed: digits };
    if (digits.length >= 11 && digits.length <= 15) return { value: digits };
    return { error: "That doesn't look like a complete WhatsApp number — include the country code, e.g. 91 98765 43210." };
  }

  async function saveProfile(): Promise<boolean> {
    const norm = normalizeWhatsapp(whatsapp);
    if ("error" in norm) {
      setWhatsappError(norm.error);
      return false;
    }
    setWhatsappError(null);
    const savedWhatsapp = norm.value ?? "";
    if (norm.value && whatsapp !== norm.value) setWhatsapp(norm.value);
    if (lastSaved.current.name === name && lastSaved.current.bio === bio && lastSaved.current.whatsapp === savedWhatsapp) return true;
    setSaveStatus("saving");
    setSaveNote("");
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0, 60), bio: bio.slice(0, 160), whatsapp: norm.value }).eq("id", acc.user.id);
    if (error) {
      setSaveStatus("idle");
      toast.error(error.message);
      return false;
    }
    lastSaved.current = { name, bio, whatsapp: savedWhatsapp };
    setSaveStatus("saved");
    if (norm.prefixed) setSaveNote(`Saved as +91 ${norm.prefixed}`);
    qc.invalidateQueries({ queryKey: ["account"] });
    return true;
  }

  function editField(set: (v: string) => void) {
    return (v: string) => {
      set(v);
      setSaveStatus("idle");
      setSaveNote("");
    };
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

  // Store rows are the product/service rows only. Legacy link-kind
  // rows are not the store's items, so they don't count towards the
  // free-plan item limit in this UI. (The database trigger still
  // counts every row — see the note in addItem.)
  const storeRows = links.filter((l) => l.kind !== "link");
  const itemCount = storeRows.length;

  async function addItem(kind: "product" | "service") {
    // NOTE: TESTING_FREE does not lift this check. Also note the
    // enforce_link_limit trigger counts ALL of the user's rows
    // (including legacy link rows), so a free user whose old link
    // rows fill the quota can still be refused by the database even
    // when this UI count has room — the trigger's message is what
    // the toast below then shows.
    if (!canAddLink(itemCount, acc.isPro)) return void toast.error(`Free plan allows ${FREE_LINK_LIMIT} items. Upgrade to Pro for unlimited.`);
    // New items start as drafts (switched off): nothing goes live
    // half-made.
    const { data, error } = await supabase.from("links").insert({ user_id: acc.user.id, kind, title: kind === "product" ? "New product" : "New service", url: "", position: links.length, enabled: false }).select().single();
    if (error) return void toast.error(error.message);
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
    <div>
      {/* Mobile preview access: on phones the preview aside is hidden,
          so a toggle near the top expands the preview right here. On
          large screens the aside below is always visible instead. */}
      <div className="mb-6 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
          <Eye className="h-4 w-4" /> {showPreview ? "Hide preview" : "Preview"}
        </Button>
        {showPreview && (
          <div className="mt-4">
            <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
          </div>
        )}
      </div>
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
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload store logo">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
              <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            <div className="w-full flex-1 space-y-3">
              <Input value={name} onChange={(e) => editField(setName)(e.target.value)} onBlur={() => void saveProfile()} placeholder="Store name" maxLength={60} />
              <Textarea value={bio} onChange={(e) => editField(setBio)(e.target.value)} onBlur={() => void saveProfile()} placeholder="Short store description (160 characters)" maxLength={160} rows={2} />
              <div className="space-y-1.5">
                <Label>WhatsApp number for orders</Label>
                <Input value={whatsapp} onChange={(e) => editField(setWhatsapp)(e.target.value)} onBlur={() => void saveProfile()} placeholder="98765 43210" inputMode="tel" />
                <p className="text-xs text-muted-foreground">Visitors use this number to order on WhatsApp. Include the country code — for India, start with 91.</p>
                {whatsappError && <p className="text-sm font-medium text-destructive">{whatsappError}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={async () => { if (await saveProfile()) toast.success("Store saved"); }}>Save store</Button>
                {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving…</span>}
                {saveStatus === "saved" && <span className="text-sm text-muted-foreground">{saveNote || "Saved"}</span>}
              </div>
            </div>
          </div>
          <p className="mt-3 text-base text-muted-foreground">Logo is optional — if you skip it, we show your store initial instead.</p>
        </section>

        {/* Shop */}
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Shop products &amp; services</h2>
          </div>
          <p className="mt-4 text-base text-muted-foreground">Everything you add appears on your shop page.</p>
          <p className="mt-2 truncate text-base font-medium text-primary">{pageUrl.replace(/^https?:\/\//, "")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><a href={pageUrl} target="_blank" rel="noreferrer">View my shop</a></Button>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Shop link copied"); }}><Copy className="h-4 w-4" /> Copy shop link</Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => addItem("product")} className="min-h-[48px] rounded-full text-base"><ShoppingBag className="h-4 w-4" /> Shop product</Button>
            <Button variant="outline" onClick={() => addItem("service")} className="min-h-[48px] rounded-full text-base"><Briefcase className="h-4 w-4" /> Service</Button>
          </div>
          {!whatsapp && storeRows.some((l) => l.enabled) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              Add your WhatsApp number above, in Your store, so visitors can order or book on WhatsApp.
            </p>
          )}
          {!canAddLink(itemCount, acc.isPro) && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
              You've used all {FREE_LINK_LIMIT} free items. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro ({proPriceLine(region)})</Link> for unlimited items.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={storeRows.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-4 space-y-3">
                {storeRows.map((l) => <DashboardLinkItem key={l.id} link={l} onUpdate={updateLink} onDelete={deleteLink} userId={acc.user.id} justCreated={l.id === justCreatedId} hasWhatsApp={Boolean(p.whatsapp)} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {storeRows.length === 0 && <p className="mt-6 text-center text-base text-muted-foreground">No products or services yet. Add your first product above — it starts switched off, so you can finish it before anyone sees it.</p>}
        </section>
      </div>
      <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
        <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
      </aside>
    </div>
    </div>
  );
}
