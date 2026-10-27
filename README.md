# Izzy

One link for your shop, WhatsApp and payments. Free to start, free during testing, Pro ₹99/month in India / $1/month elsewhere.

Izzy is a link-in-bio site for small business creators: a public page per username,
a dashboard to add links, themes, analytics and a QR code. Products added in the
dashboard also appear on a separate shop page at `/{username}/shop`, where
visitors order on WhatsApp — no payment is taken inside Izzy.

## No Lovable needed

This repo is standalone. It is not connected to Lovable, and needs no Lovable
account, editor, or credits. It deploys from GitHub to Vercel.

The only Lovable-named item left is `@lovable.dev/vite-tanstack-config`, a plain
npm build helper package — it is installed from npm like any other dependency
and is what makes the proven Vercel build work. All Lovable Cloud code
(auth, preview auth, error reporting, `.lovable/` metadata) has been removed.

## Run locally

```bash
bun install
bun run dev
```

## Deploy to Vercel

1. Import this repo (`izzytag/izzy`) in Vercel.
2. Set these env vars in Vercel (same Supabase project as Linkly, or a new
   Supabase project with the migrations in `drizzle/migrations` applied):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
3. Deploy. The build command is `vite build`.

## Auth notes

- Email sign-up / sign-in works with a real email and a strong, unique password
  (common/leaked passwords and test/example email domains are rejected by Supabase).
- Google sign-in is hidden for now: the Supabase project has no Google OAuth
  secret configured. To re-enable it, configure Google OAuth in Supabase,
  allow the Vercel redirect URL, then restore a `signInWithOAuth` button in
  `src/routes/auth.tsx`.
- If a user signed up with Google before, they can use Forgot password on the
  email form to set a password, then log in with email.

## Pro

Pro is ₹99/month in India / $1/month elsewhere in the UI (Izzy only, shown as-is, no geo-detection). Checkout itself is still a placeholder — no
Stripe/Razorpay checkout is built yet.
