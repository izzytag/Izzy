import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Visitor country from the hosting platform's geo headers, when present.
 * Vercel adds `x-vercel-ip-country` to requests hitting its functions;
 * Cloudflare-style `cf-ipcountry` is checked as a fallback. No auth is
 * needed: this only reveals the caller's own country, and the client
 * keeps its timezone fallback when the header is absent (unknown => ROW).
 */
export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const request = getRequest();
    const headers = request?.headers;
    if (!headers) return { country: null as string | null };
    const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
    return { country: country ? country.toUpperCase() : null };
  } catch {
    return { country: null as string | null };
  }
});
