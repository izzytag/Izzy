import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { SOCIALS, THEMES, type ThemeId } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhonePreview } from "@/components/PhonePreview";

export const Route = createFileRoute("/_authenticated/dashboard/appearance")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  component: AppearancePage,
});

function AppearancePage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const qc = useQueryClient();
  const p = acc.profile;
  const [theme, setTheme] = useState<ThemeId>((p.theme as ThemeId) ?? "light");
  const [socials, setSocials] = useState<Record<string, string>>((p.socials as Record<string, string>) ?? {});
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? "");
  const [upi, setUpi] = useState(p.upi_id ?? "");

  async function save() {
    if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return void toast.error("Enter a valid UPI ID like name@okaxis");
    const { error } = await supabase.from("profiles").update({
      theme, socials, whatsapp: whatsapp.trim() || null, upi_id: upi.trim() || null,
    }).eq("id", acc.user.id);
    if (error) return void toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  const preview = { ...p, socials, whatsapp: whatsapp || null, upi_id: upi || null, links: links.filter((l) => l.enabled) };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="text-lg font-bold">Theme</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const locked = !t.free && !acc.isPro;
              return (
                <button key={t.id} onClick={() => locked ? toast("Pro theme", { description: "Upgrade to Pro to use all themes." }) : setTheme(t.id)}
                  className={`group relative flex flex-col items-center gap-1.5 ${locked ? "opacity-60" : ""}`}>
                  <span className={`theme-${t.id} flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 bg-page-bg p-2 ${theme === t.id ? "border-primary" : "border-transparent"}`}>
                    <span className="h-1.5 w-3/4 rounded-full bg-page-btn" />
                    <span className="h-1.5 w-3/4 rounded-full bg-page-btn" />
                    <span className="h-1.5 w-3/4 rounded-full bg-page-btn" />
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium">
                    {locked && <Lock className="h-3 w-3" />}{theme === t.id && <Check className="h-3 w-3 text-primary" />}{t.name}
                  </span>
                </button>
              );
            })}
          </div>
          {!acc.isPro && <p className="mt-3 text-sm text-muted-foreground">Light and Dark are free. <Link to="/dashboard/upgrade" className="font-semibold text-primary">Unlock 6 more with Pro</Link>.</p>}
        </section>

        <section className="space-y-4 rounded-3xl border bg-card p-5">
          <h2 className="text-lg font-bold">WhatsApp & UPI</h2>
          <div className="space-y-1.5"><Label>WhatsApp number</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="98765 43210" inputMode="tel" /></div>
          <div className="space-y-1.5">
            <Label>UPI ID</Label>
            <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@okaxis" />
            <p className="text-xs text-muted-foreground">Buyers enter the amount themselves in their UPI app.</p>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border bg-card p-5">
          <h2 className="text-lg font-bold">Social links</h2>
          {SOCIALS.filter((s) => s.key !== "whatsapp").map((s) => (
            <div key={s.key} className="space-y-1.5">
              <Label>{s.label}</Label>
              <Input value={socials[s.key] ?? ""} onChange={(e) => setSocials({ ...socials, [s.key]: e.target.value })}
                placeholder="username or full link" />
            </div>
          ))}
        </section>
        <Button onClick={save} className="h-12 w-full rounded-xl text-base">Save changes</Button>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <PhonePreview data={preview} theme={theme} showBranding={!acc.isPro} />
      </aside>
    </div>
  );
}
