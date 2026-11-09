import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Camera, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { effectiveTheme } from "@/lib/themes";
import { TESTING_FREE, testingBanner, effectiveIsPro } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhonePreview } from "@/components/PhonePreview";

export const Route = createFileRoute("/_authenticated/dashboard/store")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: MyShopPage,
});

/**
 * My Shop — shop identity only: name, logo, description, category
 * and the WhatsApp number orders go to, plus the shop link and its
 * publishing status. Products live on the Products page. Identity
 * saves automatically when a field loses focus (the Save button
 * calls the same path), exactly as the old Store tab behaved.
 */
function MyShopPage() {
  const region = useRegion();
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const [name, setName] = useState(p.display_name ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [category, setCategory] = useState(p.category ?? "");
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? "");
  const [avatar, setAvatar] = useState(p.avatar_url);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveNote, setSaveNote] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const lastSaved = useRef({ name: p.display_name ?? "", bio: p.bio ?? "", category: p.category ?? "", whatsapp: p.whatsapp ?? "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);
  const pro = effectiveIsPro(acc.isPro);

  const liveCount = links.filter((l) => l.enabled && l.kind !== "link").length;

  // The WhatsApp number is normalised to digits first: empty is
  // fine, a bare 10-digit Indian number gets the 91 country code,
  // 11–15 digits are taken as already complete, and anything else is
  // an inline error that is never saved.
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
    if (lastSaved.current.name === name && lastSaved.current.bio === bio && lastSaved.current.category === category && lastSaved.current.whatsapp === savedWhatsapp) return true;
    setSaveStatus("saving");
    setSaveNote("");
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0, 60), bio: bio.slice(0, 160), category: category || null, whatsapp: norm.value }).eq("id", acc.user.id);
    if (error) {
      setSaveStatus("idle");
      toast.error(error.message);
      return false;
    }
    lastSaved.current = { name, bio, category, whatsapp: savedWhatsapp };
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

  const preview = {
    ...p, display_name: name, bio, avatar_url: avatar, whatsapp: whatsapp || null,
    socials: (p.socials as Record<string, string>) ?? {},
    links: links.filter((l) => l.enabled && l.kind !== "link"),
  };

  return (
    <div>
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
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">My Shop</h1>
            <p className="mt-1 text-base text-muted-foreground">Your business details, shown at the top of your shop page.</p>
          </div>

          {TESTING_FREE && (
            <p className="rounded-xl border bg-primary-soft p-4 text-base font-medium text-accent-foreground">{testingBanner(region)}</p>
          )}

          {/* Shop link + publishing status */}
          <section className="rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">Your shop link</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Live
              </span>
            </div>
            <p className="mt-2 break-all text-base font-medium text-primary">{pageUrl.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-base text-muted-foreground">
              {liveCount > 0
                ? `${liveCount} ${liveCount === 1 ? "product or service is" : "products and services are"} live on your shop.`
                : <>No products live yet — visitors will see your shop with nothing to order. <Link to="/dashboard/products" className="font-semibold text-primary underline">Add your first product</Link>.</>}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" asChild className="min-h-[44px]"><a href={pageUrl} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> View my shop</a></Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Shop link copied"); }} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy shop link</Button>
            </div>
          </section>

          {/* Business details */}
          <section className="rounded-xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-bold">Business details</h2>
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
              <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload shop logo">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
                <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <div className="w-full flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="shop-name">Business name</Label>
                  <Input id="shop-name" value={name} onChange={(e) => editField(setName)(e.target.value)} onBlur={() => void saveProfile()} placeholder="Business name" maxLength={60} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-category">Business category</Label>
                  <div className="relative">
                    <select id="shop-category" value={category} onChange={(e) => editField(setCategory)(e.target.value)} onBlur={() => void saveProfile()}
                      className="h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-base text-foreground">
                      <option value="">Choose a category…</option>
                      {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-bio">Short description</Label>
                  <Textarea id="shop-bio" value={bio} onChange={(e) => editField(setBio)(e.target.value)} onBlur={() => void saveProfile()} placeholder="Short business description (160 characters)" maxLength={160} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-wa">WhatsApp number for orders</Label>
                  <Input id="shop-wa" value={whatsapp} onChange={(e) => editField(setWhatsapp)(e.target.value)} onBlur={() => void saveProfile()} placeholder="98765 43210" inputMode="tel" />
                  <p className="text-sm text-muted-foreground">Visitors use this number to order on WhatsApp. Include the country code — for India, start with 91.</p>
                  {whatsappError && <p className="text-sm font-medium text-destructive">{whatsappError}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={async () => { if (await saveProfile()) toast.success("Shop saved"); }}>Save shop</Button>
                  {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving…</span>}
                  {saveStatus === "saved" && <span className="text-sm text-muted-foreground">{saveNote || "Saved"}</span>}
                </div>
              </div>
            </div>
            <p className="mt-3 text-base text-muted-foreground">Logo is optional — if you skip it, we show your business initial instead. To manage what you sell, go to <Link to="/dashboard/products" className="font-semibold text-primary underline">Products</Link>.</p>
          </section>
        </div>
        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <PhonePreview data={preview} theme={effectiveTheme(p.theme, pro)} showBranding={!pro} />
        </aside>
      </div>
    </div>
  );
}
