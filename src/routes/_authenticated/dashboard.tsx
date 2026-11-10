import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  BarChart3, ChevronUp, LayoutDashboard, LifeBuoy, LogOut, Menu, Package, Palette, QrCode, Settings, Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — izzy" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    // Owners who have not claimed a shop link yet go through
    // onboarding first — every dashboard screen needs a username.
    // Owners with one never see onboarding again.
    if (!acc.profile.username) throw redirect({ to: "/onboarding" });
    return acc;
  },
  component: DashboardLayout,
});

/** Main sections — shown in the desktop sidebar and the mobile tab bar. */
const NAV_MAIN = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/store", label: "My Shop", icon: Store, exact: false },
  { to: "/dashboard/products", label: "Products", icon: Package, exact: false },
  { to: "/dashboard/appearance", label: "Store Appearance", icon: Palette, exact: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, exact: false },
] as const;

/** Secondary destinations — sidebar lower section / mobile header menu. */
const NAV_SECONDARY = [
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/support", label: "Help / Support", icon: LifeBuoy },
] as const;

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function DashboardLayout() {
  const { data } = useSuspenseQuery(accountQuery);
  const signOut = useSignOut();
  const p = data.profile;
  const businessName = p.display_name || p.username || "Your shop";

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex items-center gap-2 px-5 pb-2 pt-5">
          <Logo />
          <Badge variant={data.isPro ? "default" : "secondary"}>{data.isPro ? "Pro" : "Free"}</Badge>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
          {NAV_MAIN.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary" }}>
              <n.icon className="h-5 w-5 shrink-0" /> {n.label}
            </Link>
          ))}
          {/* QR Code lives in the sidebar only: the mobile bottom bar
              keeps its five slots, and on mobile the page is reached
              from the header menu and the Overview quick action. */}
          <Link to="/dashboard/qr"
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            activeProps={{ className: "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary" }}>
            <QrCode className="h-5 w-5 shrink-0" /> QR Code
          </Link>
          <div className="my-3 border-t" />
          {NAV_SECONDARY.map((n) => (
            <Link key={n.to} to={n.to}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary" }}>
              <n.icon className="h-5 w-5 shrink-0" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-h-[52px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-muted">
              {p.avatar_url
                ? <img src={p.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{businessName[0]?.toUpperCase()}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-tight">{businessName}</span>
                <span className="block truncate text-sm text-muted-foreground">@{p.username}</span>
              </span>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/dashboard/support"><LifeBuoy className="h-4 w-4" /> Help / Support</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void signOut()}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Suspended shop (Step 06): the owner keeps full dashboard
            access — only the public storefront is unavailable — and is
            told plainly, with a path to support. */}
        {p.suspended && (
          <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 sm:px-5" role="alert">
            <p className="mx-auto max-w-6xl text-base leading-relaxed">
              <strong>Your shop is suspended.</strong> Customers see it as temporarily unavailable and can't place
              orders right now. Your products and data are untouched. If you think this is a mistake,{" "}
              <Link to="/dashboard/support" className="font-semibold underline underline-offset-2">contact support</Link>.
            </p>
          </div>
        )}

        {/* ---------- Mobile header ---------- */}
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Logo />
              <Badge variant={data.isPro ? "default" : "secondary"}>{data.isPro ? "Pro" : "Free"}</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account menu" className="flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-muted">
                <Menu className="h-6 w-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild><Link to="/dashboard/qr"><QrCode className="h-4 w-4" /> QR Code</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/support"><LifeBuoy className="h-4 w-4" /> Help / Support</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-5 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ---------- Mobile bottom navigation ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Dashboard">
        <div className="grid grid-cols-5">
          {NAV_MAIN.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
              className={cn("flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition")}
              activeProps={{ className: "text-primary" }}>
              <n.icon className="h-6 w-6" />
              <span className="max-w-full truncate">{n.label === "Store Appearance" ? "Appearance" : n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
