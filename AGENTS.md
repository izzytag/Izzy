# Izzy architecture

Izzy is a standalone link-in-bio site. It is NOT connected to Lovable — it lives
in GitHub and deploys to Vercel, with no Lovable account, editor, or credits needed.

- Plan rules (link limit, Pro-only themes, username validation) live in `src/lib/themes.ts` and are mirrored in DB (`is_pro()`, `enforce_link_limit` trigger) — the DB is the source of truth so limits can't be bypassed from the browser.
- Public pages `/$username` load via a public server function with the publishable key, so SSR can emit per-profile SEO tags.
- Avatars live in a private bucket served via long-lived signed URLs.
- Billing goes through `src/lib/billing.ts`; Pro status must only be written server-side, never from the client. Razorpay subscriptions are LIVE for India (₹99/month): the server creates the subscription, activation happens only after server-side HMAC verification, the webhook keeps the subscriptions row in sync, and sellers can cancel at cycle end from the Plan page. Stripe for the rest of the world ($1/month) is NOT built yet — ROW visitors see a "Stripe checkout coming soon" state. TESTING_FREE in src/lib/billing.ts is false (live payments); if it were flipped it would only change Pro *display* behaviour (all themes, no branding) — the DB link-limit trigger is NOT lifted by that flag.
- Auth is email + password via Supabase. Google sign-in is hidden until Google OAuth (client ID + secret) is configured in Supabase and the Vercel redirect URL is allowed.
- Vercel needs these env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.
- Admin panel (`/admin`) is allowlist-gated: every admin server function checks `ADMIN_EMAILS` (comma-separated login emails, set in Vercel Production + Preview). If it is unset, the panel is closed to everyone.
