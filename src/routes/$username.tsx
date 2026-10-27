import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const p = loaderData.profile;
    const name = p.display_name || p.username;
    const title = `${name} (@${p.username}) | izzy`;
    const desc = p.bio || `All of ${name}'s links in one place.`;
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
    return { meta };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">This page isn't taken yet</h1>
      <p className="text-muted-foreground">Grab this username for your own izzy page.</p>
      <Link to="/auth" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Create your page</Link>
    </div>
  ),
  component: PublicPage,
});

function PublicPage() {
  const { profile, links, isPro } = Route.useLoaderData();
  const pro = effectiveIsPro(isPro);
  useEffect(() => {
    supabase.from("page_views").insert({ profile_id: profile.id }).then(() => {});
  }, [profile.id]);
  const onClick = (id: string) => {
    supabase.from("link_clicks").insert({ link_id: id, profile_id: profile.id }).then(() => {});
  };
  const hasProducts = links.some((l) => l.kind === "product");
  return (
    <PublicProfile
      data={{ ...profile, socials: (profile.socials as Record<string, string>) ?? {}, links }}
      theme={effectiveTheme(profile.theme, pro)}
      showBranding={!pro}
      onLinkClick={onClick}
      shopHref={hasProducts ? `/${profile.username}/shop` : null}
    />
  );
}
