import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { trackProductView, trackShopView, trackWhatsappClick } from "@/lib/track";
import { getPublicPage } from "@/lib/public-page.functions";
import { PublicProfile } from "@/components/PublicProfile";
import { effectiveTheme } from "@/lib/themes";
import { effectiveIsPro } from "@/lib/billing";

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const data = await getPublicPage({ data: { username: params.username } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Page not found — izzy" }, { name: "robots", content: "noindex" }] };
    if (loaderData.suspended) return { meta: [{ title: "Shop unavailable — izzy" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.profile;
    const name = p.display_name || p.username;
    const title = `${name} (@${p.username}) | izzy`;
    const desc = p.bio || `Shop ${name}'s products and services — order on WhatsApp.`;
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (p.avatar_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: p.avatar_url }, { name: "twitter:image", content: p.avatar_url });
    }
    // Structured data for the shop itself — built only from the
    // business's own saved fields (name, link, description, photo).
    const store: {
      "@context": string;
      "@type": string;
      name: string;
      url: string;
      description?: string;
      image?: string;
    } = {
      "@context": "https://schema.org",
      "@type": "Store",
      // A loaded shop always has a username (the loader fetches by
      // it); the final fallback only satisfies the nullable types.
      name: name ?? p.username ?? "",
      url: `https://izzytag.shop/${p.username}`,
    };
    if (p.bio) store.description = p.bio;
    const avatar = p.avatar_url;
    if (avatar?.startsWith("https://")) store.image = avatar;
    return { meta, scripts: [{ type: "application/ld+json", children: JSON.stringify(store) }] };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">This shop isn't here yet</h1>
      <p className="text-muted-foreground">Grab this username for your own izzy shop.</p>
      <Link to="/auth" className="flex min-h-[52px] items-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground">Create your shop</Link>
    </div>
  ),
  component: PublicPage,
});

function PublicPage() {
  const data = Route.useLoaderData();
  // Suspended shop: a plain unavailable state — no products, no
  // WhatsApp button, and the tracking effect below never mounts.
  if (data.suspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold">This shop is temporarily unavailable</h1>
        <p className="max-w-md text-muted-foreground">
          {data.displayName ? `${data.displayName} can't take orders right now. ` : ""}Please check back later.
        </p>
        <Link to="/" className="flex min-h-[52px] items-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground">Go to izzy</Link>
      </div>
    );
  }
  return <LiveShop data={data} />;
}

type LiveData = Extract<Awaited<ReturnType<typeof getPublicPage>>, { suspended: false }>;

function LiveShop({ data }: { data: LiveData }) {
  const { profile, links, isPro } = data;
  const pro = effectiveIsPro(isPro);
  // Analytics (Step 04, lib/track.ts): one shop view per visitor
  // session, a product view when a customer opens a product's
  // details, a WhatsApp click when they tap Order/Book. The shop
  // owner is never counted, and tracking never blocks the page.
  useEffect(() => {
    trackShopView(profile.id);
  }, [profile.id]);
  const onClick = (id: string) => trackWhatsappClick(profile.id, id);
  const onProductView = (id: string) => trackProductView(profile.id, id);
  // The main page IS the storefront: the loader returns the enabled
  // products and services, and PublicProfile renders them as the
  // catalogue under the store header.
  return (
    <PublicProfile
      data={{ ...profile, socials: (profile.socials as Record<string, string>) ?? {}, links }}
      theme={effectiveTheme(profile.theme, pro)}
      showBranding={!pro}
      reportable
      onLinkClick={onClick}
      onProductView={onProductView}
    />
  );
}
