import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2, CreditCard, Flag, LayoutDashboard, LifeBuoy, ScrollText, Settings, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCheck } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — izzy" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/businesses", label: "Businesses", icon: Building2, exact: false },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, exact: false },
  { to: "/admin/support", label: "Support", icon: LifeBuoy, exact: false },
  { to: "/admin/reports", label: "Reports", icon: Flag, exact: false },
  { to: "/admin/settings", label: "Platform Settings", icon: Settings, exact: false },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText, exact: false },
] as const;

type Gate = { state: "loading" } | { state: "denied"; enabled: boolean } | { state: "ok"; email: string };

/**
 * Admin shell — completely separate from the seller dashboard.
 *
 * This guard is UX ONLY: it keeps non-admins out of the screens, but
 * the real gate is the ADMIN_EMAILS allowlist re-checked inside every
 * admin server function on every call. If the env var is unset, admin
 * is closed for everyone, including here.
 */
function AdminLayout() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<Gate>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      try {
        const res = await adminCheck();
        if (cancelled) return;
        setGate(res.admin ? { state: "ok", email: res.email ?? "" } : { state: "denied", enabled: res.enabled });
      } catch {
        if (!cancelled) setGate({ state: "denied", enabled: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (gate.state === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (gate.state === "denied") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-5">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">
            {gate.enabled ? "You're not an admin for this platform" : "Admin access is not enabled"}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {gate.enabled
              ? "This area is restricted to authorized izzy administrators. Your account isn't on the admin list."
              : "The admin panel is switched off. The site owner enables it by adding admin emails to the ADMIN_EMAILS setting on the server."}
          </p>
          <Button asChild className="mt-5 min-h-[44px]">
            <Link to="/dashboard">Go to your dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-5">
          <span className="text-lg font-extrabold tracking-tight">
            izzy <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">Admin</span>
          </span>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className={cn(
                  "flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                )}
                activeProps={{ className: "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary" }}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden text-sm text-muted-foreground md:block">{gate.email}</span>
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline">
            Seller dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5">
        <Outlet />
      </main>
    </div>
  );
}
