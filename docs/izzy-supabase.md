# Izzy Supabase — current model and the clean-separation plan

This is a code-side redesign note only. It does **not** create a Supabase
project, change any Vercel env var, or touch any credential. Today's login
keeps working exactly as before.

## What Izzy actually uses today

Izzy shares a Supabase project with Linkly today (see README: the same four
Vercel env vars). The tables and code below are the Izzy-specific model —
no new table or column was needed for the shop, so **no new drizzle
migration was added in this change**.

| Table | Used for |
| --- | --- |
| `profiles` | One row per user (created by the `handle_new_user` trigger on sign-up): `username`, `display_name`, `bio`, `avatar_url`, `theme`, `socials` (JSON), `whatsapp`, `upi_id`. Public pages read only profiles with a username. |
| `links` | Everything on a page. `kind` is `'link'` \| `'product'` \| `'service'`, with `title`, `url`, `price`, `description`, `enabled`, `position`. Products and services are cards, not external links, and their WhatsApp button is built client-side (`waCardLink` in `src/lib/themes.ts`). |
| `links.image_urls` + `links.category` | Added by `drizzle/migrations/0003_catalogue_photos_details.sql`. Up to 4 photos per product/service (`CATALOGUE_PHOTO_LIMIT` in `src/lib/catalogue.ts`). |
| `subscriptions` | `plan` (`free`/`pro`), `status`, `current_period_end`. Read by the `is_pro()` SQL function. Pro checkout is still a placeholder — no payment code writes here. |
| `link_clicks`, `page_views` | Analytics inserts only (public pages log a view; product/service clicks log a click). Dashboard analytics reads the owner's own rows. |
| `contact_messages` | Contact form only (`drizzle/migrations/0001_migration.sql`). |

Storage buckets:

- `avatars` — profile photos. Code uploads then stores a long-lived signed
  URL in `profiles.avatar_url`.
- `catalogue` — product/service photos. Policies are in migration 0003
  (owner upload/read/delete). Code uploads then stores a long-lived signed
  URL in `links.image_urls`, so the public shop page can show photos
  without a public bucket.

Server functions (public, publishable key only):

- `getPublicPage` (`src/lib/public-page.functions.ts`) — profile + all
  enabled links, ordered by `position`, plus `is_pro`.
- `getPublicShop` (same file) — profile + enabled `kind='product'` links
  only, with `image_urls`. This powers `/{username}/shop`. It reuses the
  existing tables; it is a filtered view, not a new backend.

Plan rules — the database is the source of truth:

- `is_pro()` and the `enforce_link_limit` trigger (migration 0000) cap
  free accounts at 5 links. The client flag `TESTING_FREE` in
  `src/lib/billing.ts` only changes *display* behaviour (all themes
  available, "Made with Izzy" footer hidden, testing banner shown). It does
  **not** lift the 5-link trigger, and the 30-day analytics range is still
  gated in the dashboard. That is deliberate: lifting the trigger on the
  shared project would also lift it for Linkly.

## Izzy-specific vs shared today

- Izzy-specific in code: the name/branding, the shop route
  (`src/routes/$username_.shop.tsx`), the shop link on `/$username`, the
  dashboard "View my Shop" box, and Izzy pricing
  (₹99/month in India / $1/month elsewhere, `src/lib/billing.ts`).
- Shared today: the Supabase project, its auth users, and all rows above.
  An Izzy test user today is a row in the shared project. Nothing in this
  change separates the data.

## What a clean, separate Izzy Supabase project needs (later, by hand)

Do this only when ready to move Izzy off the shared project — it will
change login for Izzy, so test it on the Vercel preview first:

1. Create a **new** Supabase project for Izzy only.
2. Apply the migrations in order from `drizzle/migrations/`:
   `0000_migration.sql`, `0001_migration.sql`,
   `0002_product_service_cards.sql`, `0003_catalogue_photos_details.sql`.
   (These create the tables, `is_pro()`, the link-limit trigger, the
   sign-up trigger, RLS policies, and the catalogue storage policies.)
3. Create the storage buckets `avatars` and `catalogue` in the new project
   (buckets themselves are not created by the SQL migrations).
4. In Vercel, for the Izzy project only, set the four env vars to the new
   project's values — never paste keys into chat or code:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`.
5. Redeploy Izzy and test, in order: sign up with a real email + strong
   password, create a page, add a product with a photo, open
   `/{username}/shop`, and tap "Order on WhatsApp".
6. Optional, only after step 5 passes: in the new project, if free testing
   should truly be unlimited, change `enforce_link_limit` there (Izzy-only)
   — do not change it on the shared project. Then, and only then, flip
   `TESTING_FREE` to `false` in `src/lib/billing.ts` when the Pro paywall
   returns.

Still not done (out of scope for this change): real Stripe/Razorpay
checkout, a separate Supabase project itself, and Google sign-in (hidden
until Google OAuth is configured in Supabase — see README "Auth notes").
