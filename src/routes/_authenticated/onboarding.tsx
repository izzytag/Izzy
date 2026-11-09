import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, LogOut, MessageCircle, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { validateUsername } from "@/lib/themes";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your shop — izzy" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    // Onboarding is only for owners who have not claimed a shop link
    // yet. Anyone who already has one goes straight to the dashboard
    // and is never asked to repeat setup.
    if (acc.profile.username) throw redirect({ to: "/dashboard" });
    return acc;
  },
  component: OnboardingPage,
});

const STEP_LABELS = ["Welcome", "Business", "WhatsApp", "Shop link", "Done"];

/** Dial codes offered at the WhatsApp step. India first (the default). */
const COUNTRIES = [
  { name: "India", code: "91" },
  { name: "United Arab Emirates", code: "971" },
  { name: "United States", code: "1" },
  { name: "Canada", code: "1" },
  { name: "United Kingdom", code: "44" },
  { name: "Singapore", code: "65" },
  { name: "Malaysia", code: "60" },
  { name: "Indonesia", code: "62" },
  { name: "Philippines", code: "63" },
  { name: "Australia", code: "61" },
  { name: "New Zealand", code: "64" },
  { name: "Saudi Arabia", code: "966" },
  { name: "Qatar", code: "974" },
  { name: "Kuwait", code: "965" },
  { name: "Oman", code: "968" },
  { name: "Bahrain", code: "973" },
  { name: "Pakistan", code: "92" },
  { name: "Bangladesh", code: "880" },
  { name: "Sri Lanka", code: "94" },
  { name: "Nepal", code: "977" },
  { name: "South Africa", code: "27" },
  { name: "Kenya", code: "254" },
  { name: "Nigeria", code: "234" },
  { name: "Germany", code: "49" },
  { name: "France", code: "33" },
  { name: "Netherlands", code: "31" },
  { name: "Spain", code: "34" },
  { name: "Italy", code: "39" },
  { name: "Brazil", code: "55" },
  { name: "Mexico", code: "52" },
] as const;

/**
 * Split a stored profiles.whatsapp value back into dial code + local
 * number for the form. Stored values are digits only, country code
 * first (the Store tab normalises them the same way).
 */
function splitWhatsapp(stored: string | null): { cc: string; national: string } {
  if (!stored) return { cc: "91", national: "" };
  const digits = stored.replace(/\D/g, "");
  const byLength = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of byLength) {
    if (digits.startsWith(c.code) && digits.length - c.code.length >= 6) {
      return { cc: c.code, national: digits.slice(c.code.length) };
    }
  }
  return { cc: "91", national: digits };
}

/**
 * Build the stored WhatsApp value from dial code + typed number,
 * following the same normalisation rules as the Store tab: digits
 * only; a 10-digit Indian number gets the 91 country code; the full
 * international number must be 11–15 digits. If the typed number
 * already starts with the chosen dial code it is not doubled.
 */
function buildWhatsapp(cc: string, raw: string): { value: string } | { error: string } {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { error: "Enter your WhatsApp number so customers can reach you." };
  let national = digits;
  if (national.startsWith(cc) && national.length - cc.length >= 6) national = national.slice(cc.length);
  national = national.replace(/^0+/, "");
  const full = cc + national;
  if (national.length < 6 || full.length < 11 || full.length > 15) {
    return { error: "That doesn't look like a complete WhatsApp number — check the number and try again." };
  }
  return { value: full };
}

/** "+91 ••••• 210" — enough to recognise the number, not to expose it. */
function maskWhatsapp(num: string): string {
  if (num.length <= 5) return num;
  const ccLen = num.length - 10 > 0 ? num.length - 10 : 2;
  return `+${num.slice(0, ccLen)} ••••• ${num.slice(-3)}`;
}

/** Resume where the owner left off: every step reads saved values. */
function initialStep(p: { display_name: string | null; whatsapp: string | null }): number {
  if (p.display_name && p.whatsapp) return 3;
  if (p.display_name) return 2;
  return 0;
}

function OnboardingPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const p = acc.profile;

  const [step, setStep] = useState(() => initialStep(p));
  const [busy, setBusy] = useState(false);

  // Business information (step 2)
  const [name, setName] = useState(p.display_name ?? "");
  const [category, setCategory] = useState(p.category ?? "");
  const [bio, setBio] = useState(p.bio ?? "");
  const [avatar, setAvatar] = useState(p.avatar_url);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // WhatsApp (step 3)
  const split = splitWhatsapp(p.whatsapp);
  const [cc, setCc] = useState(split.cc);
  const [national, setNational] = useState(split.national);
  const [waError, setWaError] = useState<string | null>(null);
  const [savedWhatsapp, setSavedWhatsapp] = useState(p.whatsapp ?? "");

  // Shop link (step 4)
  const [raw, setRaw] = useState("");
  const [origin, setOrigin] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [savedUsername, setSavedUsername] = useState("");
  const u = raw.toLowerCase().replace(/[\s-]+/g, "").replace(/[^a-z0-9_]/g, "");
  const uErr = u ? validateUsername(u) : null;

  useEffect(() => setOrigin(window.location.host), []);

  useEffect(() => {
    if (!u || validateUsername(u)) { setAvailability("idle"); return; }
    setAvailability("checking");
    const t = setTimeout(async () => {
      const { data: existing } = await supabase.from("profiles").select("id").eq("username", u).maybeSingle();
      setAvailability(existing ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [u]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function uploadLogo(f: File) {
    if (f.size > 2 * 1024 * 1024) return void toast.error("Image must be under 2MB");
    const path = `${acc.user.id}/avatar-${Date.now()}.${f.name.split(".").pop() || "jpg"}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true, contentType: f.type });
    if (error) return void toast.error(error.message);
    const { data: s } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!s) return;
    await supabase.from("profiles").update({ avatar_url: s.signedUrl }).eq("id", acc.user.id);
    setAvatar(s.signedUrl);
    qc.invalidateQueries({ queryKey: ["account"] });
    toast.success("Logo saved");
  }

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Give your business a name — this is what customers see at the top of your shop."); return; }
    setNameError(null);
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: name.trim().slice(0, 60),
      bio: bio.slice(0, 160),
      category: category || null,
    }).eq("id", acc.user.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["account"] });
    setStep(2);
  }

  async function saveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    const built = buildWhatsapp(cc, national);
    if ("error" in built) { setWaError(built.error); return; }
    setWaError(null);
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ whatsapp: built.value }).eq("id", acc.user.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    setSavedWhatsapp(built.value);
    qc.invalidateQueries({ queryKey: ["account"] });
    setStep(3);
  }

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault();
    if (validateUsername(u) || availability !== "available") return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ username: u }).eq("id", acc.user.id);
    setBusy(false);
    if (error) return void toast.error(error.code === "23505" ? "That username is taken" : error.message);
    setSavedUsername(u);
    qc.invalidateQueries({ queryKey: ["account"] });
    setStep(4);
  }

  const selectClass = "h-[52px] w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-base text-foreground";

  return (
    <div className="min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Log out</Button>
      </div>

      <div className="mx-auto mt-8 w-full max-w-xl">
        {/* Progress indicator */}
        <p className="text-sm font-medium text-muted-foreground">Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {STEP_LABELS.map((label, i) => (
            <span key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6 shadow-soft sm:p-8">
          {step === 0 && (
            <div>
              <h1 className="text-3xl font-bold">Let's get your business online.</h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Create your shop in a few simple steps and start receiving orders through WhatsApp.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Tell us about your business",
                  "Add the WhatsApp number customers reach you on",
                  "Choose your shop link — izzytag.shop/yourbusiness",
                ].map((t, i) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span>
                    <span className="pt-0.5 text-base">{t}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setStep(1)} className="mt-8 min-h-[52px] w-full text-lg">Get started</Button>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={saveBusiness}>
              <h1 className="text-2xl font-bold">About your business</h1>
              <p className="mt-1 text-base text-muted-foreground">This is what customers see at the top of your shop. You can change everything later.</p>

              <div className="mt-6 flex items-center gap-4">
                <button type="button" onClick={() => fileRef.current?.click()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload business logo">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-muted-foreground">{(name || "?")[0]}</span>}
                  <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/60 py-1 text-background"><Camera className="h-4 w-4" /></span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                <div>
                  <p className="text-base font-medium">Business logo</p>
                  <p className="text-sm text-muted-foreground">Optional — if you skip it, we show your business initial instead.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-name" className="text-base font-medium">Business name</Label>
                  <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya's Kitchen" maxLength={60} className="min-h-[52px] text-base" autoFocus />
                  {nameError && <p className="text-sm font-medium text-destructive">{nameError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-category" className="text-base font-medium">Business category <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <div className="relative">
                    <select id="ob-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                      <option value="">Choose a category…</option>
                      {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-bio" className="text-base font-medium">Short description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea id="ob-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you sell? e.g. Eggless cakes and bakes, made fresh in Pune." maxLength={160} rows={3} className="text-base" />
                  <p className="text-sm text-muted-foreground">Up to 160 characters, shown under your business name.</p>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="mt-8 min-h-[52px] w-full text-lg">{busy ? "Saving…" : "Continue"}</Button>
              <button type="button" onClick={() => setStep(0)} className="mt-3 min-h-[44px] w-full text-base font-medium text-muted-foreground">Back</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={saveWhatsapp}>
              <h1 className="text-2xl font-bold">Where should your customers contact you?</h1>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                When a customer taps Order on one of your products, WhatsApp opens a conversation with this number — with the product already in the message. You chat and arrange payment and delivery directly.
              </p>

              <div className="mt-6 space-y-1.5">
                <Label htmlFor="ob-wa" className="text-base font-medium">WhatsApp number</Label>
                <div className="flex gap-2">
                  <div className="relative w-[7.5rem] shrink-0">
                    <select aria-label="Country code" value={cc} onChange={(e) => setCc(e.target.value)} className={selectClass}>
                      {COUNTRIES.map((c) => <option key={c.name} value={c.code}>+{c.code} {c.name}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
                  </div>
                  <Input id="ob-wa" value={national} onChange={(e) => setNational(e.target.value)} placeholder="98765 43210" inputMode="tel" className="min-h-[52px] flex-1 text-base" autoFocus />
                </div>
                {waError && <p className="text-sm font-medium text-destructive">{waError}</p>}
                <p className="text-sm text-muted-foreground">Use the number on the phone where you reply to customers. You can change it later in My Shop.</p>
              </div>

              {/* Example of what the customer sees */}
              <div className="mt-6 rounded-xl border bg-background p-4" aria-label="Example WhatsApp conversation">
                <div className="flex items-center gap-3 border-b pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground"><MessageCircle className="h-4 w-4" /></span>
                  <div>
                    <p className="text-base font-semibold leading-tight">{name.trim() || "Your business"}</p>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                  </div>
                </div>
                <p className="mt-3 max-w-[85%] rounded-xl rounded-tl-sm bg-card p-3 leading-relaxed">
                  Hi! I'd like to order: <span className="font-medium">Chocolate cake — ₹499</span>
                  <span className="mt-1 block text-sm text-muted-foreground">This message is written for the customer — they just tap send.</span>
                </p>
                <p className="mt-3 text-center text-sm text-muted-foreground">An example — the chat opens on your number.</p>
              </div>

              <Button type="submit" disabled={busy} className="mt-8 min-h-[52px] w-full text-lg">{busy ? "Saving…" : "Continue"}</Button>
              <button type="button" onClick={() => setStep(1)} className="mt-3 min-h-[44px] w-full text-base font-medium text-muted-foreground">Back</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={saveUsername}>
              <h1 className="text-2xl font-bold">Create your shop link</h1>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                This is the link you share with customers — in your Instagram bio, on WhatsApp, anywhere. Choose something short that matches your business name.
              </p>
              <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">3–30 lowercase letters, numbers or _ only. Hyphens and spaces are removed.</p>
              <div className="mt-4 flex items-center rounded-lg border bg-background pl-3 focus-within:ring-2 focus-within:ring-ring">
                <span className="whitespace-nowrap text-sm text-muted-foreground">{origin || "izzytag.shop"}/</span>
                <Input autoFocus value={raw} onChange={(e) => setRaw(e.target.value)}
                  className="h-[52px] border-0 pl-1 text-base shadow-none focus-visible:ring-0" placeholder="yourbusiness" maxLength={30} aria-label="Shop username" />
              </div>
              {raw && u !== raw && (
                <p className="mt-2 text-sm text-muted-foreground">Your shop link will be: <span className="font-semibold text-foreground">{origin || "izzytag.shop"}/{u || "…"}</span></p>
              )}
              {uErr && u && <p className="mt-2 text-sm font-medium text-destructive">{uErr}</p>}
              {!uErr && availability === "checking" && <p className="mt-2 text-sm text-muted-foreground">Checking…</p>}
              {!uErr && availability === "available" && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-600"><Check className="h-4 w-4" /> Available</p>}
              {!uErr && availability === "taken" && <p className="mt-2 text-sm font-medium text-destructive">That username is taken — try another.</p>}
              <Button type="submit" disabled={!u || !!uErr || availability !== "available" || busy} className="mt-6 min-h-[52px] w-full text-lg">
                {busy ? "Creating…" : "Confirm my shop link"}
              </Button>
              <button type="button" onClick={() => setStep(2)} className="mt-3 min-h-[44px] w-full text-base font-medium text-muted-foreground">Back</button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                <PartyPopper className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-3xl font-bold">Your business is ready to get started!</h1>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Your shop is live at its link. Add your first product from the dashboard and it will appear there straight away.
              </p>
              <dl className="mt-6 space-y-3 rounded-xl bg-muted p-4 text-left">
                <div>
                  <dt className="text-sm text-muted-foreground">Business</dt>
                  <dd className="text-base font-semibold">{name.trim() || acc.profile.display_name || savedUsername}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Shop link</dt>
                  <dd className="break-all text-base font-semibold text-primary">{origin || "izzytag.shop"}/{savedUsername}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">WhatsApp for orders</dt>
                  <dd className="text-base font-semibold">{savedWhatsapp ? maskWhatsapp(savedWhatsapp) : "Not added yet"}</dd>
                </div>
              </dl>
              <Button onClick={() => navigate({ to: "/dashboard" })} className="mt-8 min-h-[52px] w-full text-lg">Go to dashboard</Button>
              <Button variant="outline" asChild className="mt-3 min-h-[52px] w-full text-lg">
                <a href={`/${savedUsername}`} target="_blank" rel="noreferrer">Preview my shop</a>
              </Button>
            </div>
          )}
        </div>

        {step < 4 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">Your answers save as you go — you can leave and pick up where you left off.</p>
        )}
      </div>
    </div>
  );
}
