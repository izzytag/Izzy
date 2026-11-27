import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { processCataloguePhoto } from "@/lib/catalogue";
import { waCardLink } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Profile = {
  display_name: string | null;
  bio: string | null;
  category: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  username: string | null;
};

/**
 * Business details — logo, business name, category, short
 * description and the WhatsApp number orders go to. Shown on the
 * dashboard Home tab and in My Shop's Edit mode. Changes are
 * saved only when the user taps Save (logo uploads save at once,
 * as before). The WhatsApp number is normalised to digits first:
 * empty is fine, a bare 10-digit Indian number gets the 91
 * country code, 11–15 digits are taken as already complete, and
 * anything else is an inline error that is never saved.
 */
export function BusinessDetails({ profile: p, userId }: { profile: Profile; userId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState(p.display_name ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [category, setCategory] = useState(p.category ?? "");
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? "");
  const [avatar, setAvatar] = useState(p.avatar_url);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveNote, setSaveNote] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pageUrl, setPageUrl] = useState(`/${p.username}`);
  useEffect(() => setPageUrl(`${window.location.origin}/${p.username}`), [p.username]);

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
    if (norm.value && whatsapp !== norm.value) setWhatsapp(norm.value);
    setSaveStatus("saving");
    setSaveNote("");
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0, 60), bio: bio.slice(0, 160), category: category || null, whatsapp: norm.value }).eq("id", userId);
    if (error) {
      setSaveStatus("idle");
      toast.error(error.message);
      return false;
    }
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
    // Same in-browser pipeline as catalogue photos: big phone photos
    // are shrunk and re-encoded as JPEG instead of being rejected
    // for being over 2MB.
    try {
      const processed = await processCataloguePhoto(f);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, processed, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data: s } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (!s) return;
      await supabase.from("profiles").update({ avatar_url: s.signedUrl }).eq("id", userId);
      setAvatar(s.signedUrl);
      qc.invalidateQueries({ queryKey: ["account"] });
      toast.success("Logo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload the logo. Please try again.");
    }
  }

  // Example customer enquiry: the exact message the storefront's
  // WhatsApp button prepares, built with the same waCardLink the
  // live shop uses — a sample product against the number in the
  // field above. Shown only when the number looks dialable; it is
  // an example, not a real message.
  let enquiryText: string | null = null;
  if (whatsapp.replace(/\D/g, "").length >= 6) {
    try {
      enquiryText = new URL(
        waCardLink(whatsapp, "product", "Sample product", pageUrl, { price: "₹499", shopName: name || "Your shop" }),
      ).searchParams.get("text");
    } catch {
      enquiryText = null;
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold">Business details</h2>
      <p className="mt-1 text-base text-muted-foreground">Shown at the top of your shop page. Tap a detail to change it, then tap Save.</p>

      <div className="mt-5 flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload shop logo">
          {avatar ? <img src={avatar} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
          <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        <div className="min-w-0">
          <p className="font-semibold">Shop logo</p>
          <p className="text-sm leading-relaxed text-muted-foreground">Tap the logo to change it. Optional — without one we show your business initial.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shop-name">Business name</Label>
          <Input id="shop-name" value={name} onChange={(e) => editField(setName)(e.target.value)} placeholder="Business name" maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-category">Business category</Label>
          <div className="relative">
            <select id="shop-category" value={category} onChange={(e) => editField(setCategory)(e.target.value)}
              className="h-11 w-full appearance-none rounded-full border border-input bg-card px-4 pr-10 text-base text-foreground">
              <option value="">Choose a category…</option>
              {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-bio">Short description</Label>
          <Textarea id="shop-bio" value={bio} onChange={(e) => editField(setBio)(e.target.value)} placeholder="Short business description (160 characters)" maxLength={160} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-wa">WhatsApp number for orders</Label>
          <Input id="shop-wa" value={whatsapp} onChange={(e) => editField(setWhatsapp)(e.target.value)} placeholder="98765 43210" inputMode="tel" />
          <p className="text-sm text-muted-foreground">Visitors use this number to order on WhatsApp. Include the country code — for India, start with 91.</p>
          {whatsappError && <p className="text-sm font-medium text-destructive">{whatsappError}</p>}
        </div>
        {enquiryText && (
          <div className="rounded-xl bg-muted p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4 text-primary" /> Example — what a customer sends you
            </p>
            <p className="mt-2 rounded-lg rounded-tl-none bg-card p-3 text-sm leading-relaxed shadow-sm">{enquiryText}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This is the message WhatsApp opens with when a customer taps Order on a product (shown
              here for a “Sample product” at ₹499), addressed to the number above. The customer can
              edit it before sending. Changing the number changes where future enquiries go.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button className="min-h-[48px] w-full text-base font-semibold sm:w-auto" onClick={async () => { if (await saveProfile()) toast.success("Shop saved"); }}>Save</Button>
          {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving…</span>}
          {saveStatus === "saved" && <span className="text-sm text-muted-foreground">{saveNote || "Saved"}</span>}
        </div>
      </div>
    </section>
  );
}
