# Razorpay webhook (Izzy Pro renewals + cancellations)

Without this webhook, a Pro subscription activates once (for one period)
and then never syncs: renewals do not extend Pro, cancellations do not
turn it off. This webhook closes that gap. It is separate from checkout:
checkout activation (client checkout + server verify) is unchanged.

## How it works

- Public endpoint: `POST https://izzytag.shop/api/razorpay-webhook`
  (path only — the domain is the live Izzy domain).
- Razorpay signs every delivery: header `x-razorpay-signature` is
  hex(HMAC-SHA256(webhook secret, exact raw request body)). The handler
  verifies against the raw body, never re-serialised JSON, with a
  constant-time comparison. Missing secret, missing/invalid signature,
  or malformed JSON is rejected (non-200) without crashing and without
  logging secrets, signatures, or payloads.
- Nothing is written from the payload alone. For every handled event the
  handler re-fetches the subscription from Razorpay with the server
  key/secret and only writes when the fetched subscription's
  `notes.user_id` identifies an Izzy user and its status confirms the
  event.
- Events handled:
  - `subscription.charged`, `subscription.activated` → Pro row upserted
    as active, with `current_period_end` taken from Razorpay's
    `current_end` (never computed locally), so a retried delivery
    writes the same value again.
  - `subscription.cancelled`, `subscription.completed` → that
    subscription row's status set to `cancelled`, period end untouched,
    so Pro gating turns off. (If Razorpay still reports the
    subscription as active — e.g. cancel-at-cycle-end — the delivery is
    acknowledged without writing, and a later event closes it.)
  - Any other event → acknowledged with 200 and ignored, so Razorpay
    does not retry it forever.
- Implementation: `src/lib/razorpay-webhook.server.ts` (handler),
  `src/lib/razorpay-webhook-route.server.ts` (HTTP adapter), wired in
  `src/server.ts` (the real server entry — this TanStack Start version
  has no API file routes, and a server function cannot see the raw
  body). Tests: `src/lib/razorpay-webhook.test.ts`.

## Morning registration steps (in order)

1. Push this branch to `main` and wait for the Vercel deployment to
   show Ready. The webhook path only exists once the new deployment
   is live.
2. In Vercel (project `izzy`), add the environment variable
   `RAZORPAY_WEBHOOK_SECRET` for Production + Preview. Do NOT put its
   value in chat, code, or this doc — copy it from step 3 only.
   (The other Razorpay variables and the Supabase service key are
   already set; do not change them.) Redeploy after adding it, so the
   running deployment can read it.
3. In the Razorpay dashboard, create a webhook:
   - Webhook URL: `https://izzytag.shop/api/razorpay-webhook`
   - Events to select (only these four):
     - `subscription.charged`
     - `subscription.activated`
     - `subscription.cancelled`
     - `subscription.completed`
   - Razorpay will show a webhook secret when the webhook is created.
     Copy that secret into the Vercel variable from step 2 (never into
     chat or code). If Razorpay asks for an alert email, use the
     owner's email.
4. In the Razorpay dashboard, send a test event for
   `subscription.charged` (or use the webhook's test-event tool) and
   confirm the endpoint answers 200. A 401 means the Vercel secret
   does not match the Razorpay webhook secret — re-copy it, redeploy,
   and retry. A 500 before any secret is set is expected (fail closed).

## Verifying with a real subscription (no test payment needed)

1. In Razorpay, pick an existing live subscription created by Izzy
   checkout and confirm its `notes.user_id` matches an Izzy user.
2. Trigger the next lifecycle event for it (renewal charge, or cancel
   it in the dashboard if it is a test account's subscription).
3. In Supabase, check that user's `subscriptions` row: after a charge
   it must be `plan = pro, status = active` with `current_period_end`
   equal to that subscription's current period end in Razorpay; after
   a cancellation it must be `status = cancelled` with the period end
   unchanged.
4. If a delivery is retried, the row must end up identical (same
   period end), not extended.

## Notes

- The webhook secret is per-webhook: if the Razorpay webhook is ever
  deleted and recreated, its secret changes, and the Vercel variable
  must be updated to match before deliveries will verify again.
- The webhook never charges anyone and never changes plans or prices.
  It only syncs the `subscriptions` row for Izzy checkout
  subscriptions.
