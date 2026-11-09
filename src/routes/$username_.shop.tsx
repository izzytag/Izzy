import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy shop URL: /$username/shop. Izzy is shop/catalog only now and
 * the storefront lives at /$username itself, so this route permanently
 * redirects there — shop links shared before the change keep working.
 * (File name keeps the TanStack non-nested trick, $username_, so the
 * path stays /$username/shop.)
 */
export const Route = createFileRoute("/$username_/shop")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$username", params: { username: params.username }, statusCode: 301 });
  },
});
