# Izzy backend (live)

Izzy uses its own Supabase project, separate from Linkly.

- Project reference: sqywkflszyraeurixtgy
- API URL: https://sqywkflszyraeurixtgy.supabase.co

Note: the API URL ends in .co, not .com. The .com address does not
resolve as a Supabase API endpoint and caused a "Failed to fetch"
error on login/signup when it was set in Vercel. Vercel env vars
(VITE_SUPABASE_URL, SUPABASE_URL, plus the publishable keys) must
use the .co URL above.

Auth for testing: email sign-in only (Google disabled), email
confirmation OFF, so a new sign-up goes straight to the dashboard.
