import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicShop } from "@/lib/public-page.functions";
import { CatalogueCard } from "@/components/CatalogueCard";
import { effectiveTheme, waLink } from "@/lib/themes";
import { effectiveIsPro } from "@/lib/billing";

/**
 * Shop route: /$username/shop — products only, mobile-first.
 * File name uses the TanStack non-nested trick ($username_): this route
 * is a top-level route with path /$username/shop, NOT a child of /$username,
 * so it renders even though /$username has no <Outlet />.
 */
export const Route = createFileRoute("/$username_/shop")({
  loader: async ({ params }) => {
    const data = await getPublicShop({ data: { username: params.username } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Shop not found — izzy" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.profile;
    const name = p.display_name || p.username;
    return {
      meta: [
        { title: `${name} — Shop | izzy` },
        { name: "description", content: p.bio || `Shop ${name}'s products and order on WhatsApp.` },
        { property: "og:title", content: `${name} — Shop | izzy` },
        { property: "og:description", content: p.bio || `Shop ${name}'s products and order on WhatsApp.` },
        { property: "og:type", content: "profile" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">This shop isn't here yet</h1>
      <p className="text-base text-muted-foreground">Grab this username for your own izzy page.</p>
      <Link to="/auth" className="flex min-h-[52px] items-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground">Create your page</Link>
    </div>
  ),
  component: ShopPage,
});

function ShopPage() {
  const { profile, products, isPro } = Route.useLoaderData();
  const pro = effectiveIsPro(isPro);
  const theme = effectiveTheme(profile.theme, pro);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const name = profile.display_name || profile.username || "";
  const pageUrl = origin ? `${origin}/${profile.username}/shop` : "";
  const btn = "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-page-border bg-page-btn px-5 py-3.5 text-base text-center font-semibold text-page-btn-fg shadow-sm transition hover:-translate-y-0.5 hover:shadow-pin active:scale-[0.98]";
  const onClick = (id: string) => {
    supabase.from("link_clicks").insert({ link_id: id, profile_id: profile.id }).then(() => {});
  };

  return (
    <div className={`theme-${theme} min-h-screen bg-page-bg text-page-fg`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-5">
        <div className="flex w-full max-w-[420px] flex-col items-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-[120px] w-[120px] rounded-full object-cover shadow-pin ring-4 ring-white/70" />
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-page-btn text-4xl font-bold text-page-btn-fg shadow-pin ring-4 ring-white/70">{name.charAt(0).toUpperCase() || "?"}</div>
        )}
        <h1 className="mt-5 text-center text-[32px] font-bold leading-tight">{name}</h1>
        {profile.username && <p className="text-base text-page-muted">@{profile.username}</p>}
        {profile.bio && <p className="mt-2 text-center text-[17px] leading-relaxed text-page-muted">{profile.bio}</p>}

        <div className="mt-7 flex w-full flex-col gap-3">
          <a href={`/${profile.username}`} className={btn}>
            ← Back to main page
          </a>
          {profile.whatsapp && (
            <a href={waLink(profile.whatsapp)} target="_blank" rel="noopener noreferrer" className={btn}>
              <MessageCircle className="h-5 w-5" /> WhatsApp me
            </a>
          )}
        </div>

        </div>

        <h2 className="mt-12 w-full text-center text-2xl font-bold">Shop</h2>
        <p className="mt-1 w-full text-center text-base text-page-muted">Tap a product to see it, then order on WhatsApp. No payment is taken here.</p>

        {products.length === 0 ? (
          <p className="mx-auto mt-8 w-full max-w-[420px] rounded-[28px] border border-page-border bg-page-btn p-6 text-center text-base text-page-btn-fg shadow-sm">
            No products yet. Check back soon — or message the seller on WhatsApp.
          </p>
        ) : (
          <div className="mt-6 w-full columns-2 gap-4 sm:columns-3 lg:columns-4">
            {products.map((p) => (
              <CatalogueCard key={p.id} item={p} whatsapp={profile.whatsapp} pageUrl={pageUrl} onLinkClick={onClick} />
            ))}
          </div>
        )}

        {!pro && (
          <a href="/" className="mt-12 flex min-h-[44px] items-center text-base font-semibold text-page-muted hover:text-page-fg">Made with Izzy</a>
        )}
      </div>
    </div>
  );
}
