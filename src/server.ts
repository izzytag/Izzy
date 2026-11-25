import "./lib/error-capture";

import { handleRazorpayWebhookRequest } from "./lib/razorpay-webhook-route.server";
import { handleSitemapRequest } from "./lib/sitemap-route.server";
import { LEGACY_GUIDE_REDIRECTS } from "./lib/seo";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Razorpay webhook: this TanStack Start version has no API file
      // routes, and a server function cannot see the raw body the
      // signature is computed over — so the webhook is intercepted
      // here, in the real server entry, before the Start handler runs.
      // Nothing else is intercepted: every other request delegates.
      if (new URL(request.url).pathname === "/api/razorpay-webhook") {
        if (request.method !== "POST") {
          return new Response(null, { status: 405, headers: { Allow: "POST" } });
        }
        return await handleRazorpayWebhookRequest(request);
      }
      // Deleted guide URLs: same interception pattern as the webhook —
      // the old slugs 404 since the slim-down, so 301 them to the
      // live guide (query string preserved). Only GET/HEAD redirect;
      // anything else falls through to the app handler.
      const redirectTarget = LEGACY_GUIDE_REDIRECTS[new URL(request.url).pathname];
      if (redirectTarget && (request.method === "GET" || request.method === "HEAD")) {
        const url = new URL(request.url);
        return new Response(null, {
          status: 301,
          headers: { Location: `${redirectTarget}${url.search}` },
        });
      }
      // Dynamic sitemap: same interception pattern as the webhook —
      // this TanStack Start version has no API file routes. The
      // static public/sitemap.xml was removed so the request reaches
      // this handler instead of being served as a stale file.
      if (new URL(request.url).pathname === "/sitemap.xml") {
        if (request.method !== "GET") {
          return new Response(null, { status: 405, headers: { Allow: "GET" } });
        }
        return await handleSitemapRequest();
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
