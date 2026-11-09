import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The dashboard landing route: Izzy is shop/catalog only, so the Store
 * tab is home. This route only redirects — /dashboard bookmarks and
 * post-login landings end up on the Store tab. (The Links tab that
 * used to live here is gone; legacy link rows stay in the database,
 * just never displayed or edited.)
 */
export const Route = createFileRoute("/_authenticated/dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/store" });
  },
});
