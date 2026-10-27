import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { validateUsername } from "@/lib/themes";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — izzy" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Links" },
  { to: "/dashboard/appearance", label: "Appearance" },
  { to: "/dashboard/analytics", label: "Analytics" },
  { to: "/dashboard/upgrade", label: "Plan" },
] as const;

function DashboardLayout() {
  const { data } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant={data.isPro ? "default" : "secondary"}>{data.isPro ? "Pro" : "Free"}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-5 w-5" /></Button>
        </div>
        {data.profile.username && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="flex h-11 items-center whitespace-nowrap rounded-full px-4 text-base font-medium text-muted-foreground transition hover:bg-muted"
                activeProps={{ className: "bg-primary-soft text-accent-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
        {data.profile.username ? <Outlet /> : <UsernamePicker />}
      </main>
    </div>
  );
}

function UsernamePicker() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(accountQuery);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const u = raw.toLowerCase().replace(/[\s-]+/g, "").replace(/[^a-z0-9_]/g, "");
  const err = u ? validateUsername(u) : null;

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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (validateUsername(u) || availability !== "available") return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ username: u }).eq("id", data.user.id);
    setBusy(false);
    if (error) return void toast.error(error.code === "23505" ? "That username is taken" : error.message);
    toast.success("Your page is live!");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  return (
    <form onSubmit={save} className="mx-auto mt-10 w-full max-w-md rounded-[2rem] border bg-card p-6 shadow-soft sm:p-8">
      <h1 className="text-3xl font-bold">Pick your username</h1>
      <p className="mt-1 text-base text-muted-foreground">This will be your unique page link. Share it in your bio.</p>
      <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">3–30 lowercase letters, numbers or _ only. Hyphens and spaces are removed.</p>
      <div className="mt-4 flex items-center rounded-xl border bg-background pl-3 focus-within:ring-2 focus-within:ring-ring">
        <span className="text-sm text-muted-foreground">{origin || "izzy"}/</span>
        <Input autoFocus value={raw} onChange={(e) => setRaw(e.target.value)}
          className="h-12 border-0 pl-1 shadow-none focus-visible:ring-0" placeholder="priya" maxLength={30} />
      </div>
      {raw && u !== raw && (
        <p className="mt-2 text-sm text-muted-foreground">Your username will be: <span className="font-semibold text-foreground">{u || "…"}</span></p>
      )}
      {err && u && <p className="mt-2 text-sm text-destructive">{err}</p>}
      {!err && availability === "checking" && <p className="mt-2 text-sm text-muted-foreground">Checking…</p>}
      {!err && availability === "available" && <p className="mt-2 text-sm font-medium text-green-600">Available</p>}
      {!err && availability === "taken" && <p className="mt-2 text-sm text-destructive">That username is taken</p>}
      <Button type="submit" disabled={!u || !!err || availability !== "available" || busy} className="mt-5 min-h-[52px] w-full rounded-xl text-lg">Claim my page</Button>
    </form>
  );
}
