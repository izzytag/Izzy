import { describe, expect, it, vi } from "vitest";

import { SITE_URL, STATIC_SITEMAP_PATHS } from "./seo";
import { listShopUsernames, type ShopUsernameRow } from "./sitemap.server";
import { handleSitemapRequest } from "./sitemap-route.server";

function rows(...usernames: (string | null)[]): ShopUsernameRow[] {
  return usernames.map((username) => ({ username, suspended: false }));
}

describe("listShopUsernames", () => {
  it("pages through all results", async () => {
    const all = rows("amy", "bob", "cat", "dan", "eve");
    const fetchPage = vi.fn(async (from: number, to: number) => all.slice(from, to + 1));

    const usernames = await listShopUsernames(fetchPage, { pageSize: 2 });

    expect(usernames).toEqual(["amy", "bob", "cat", "dan", "eve"]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 1);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 4, 5);
  });

  it("filters suspended shops, unset usernames and ineligible names", async () => {
    const fetchPage = async (): Promise<ShopUsernameRow[]> => [
      { username: "priya", suspended: false },
      { username: "closed", suspended: true },
      { username: null, suspended: false },
      { username: "admin", suspended: false },
      { username: "guides", suspended: false },
      { username: "Bad Name", suspended: false },
      { username: "ok_shop", suspended: false },
    ];

    const usernames = await listShopUsernames(fetchPage, { pageSize: 10 });

    expect(usernames).toEqual(["priya", "ok_shop"]);
  });

  it("drops duplicates and stops at maxUrls", async () => {
    const fetchPage = async (): Promise<ShopUsernameRow[]> => rows("amy", "amy", "bob", "cat");

    const usernames = await listShopUsernames(fetchPage, { pageSize: 10, maxUrls: 2 });

    expect(usernames).toEqual(["amy", "bob"]);
  });

  it("returns an empty list when there are no shops", async () => {
    const usernames = await listShopUsernames(async () => [], { pageSize: 10 });

    expect(usernames).toEqual([]);
  });

  it("propagates listing failures so the caller can degrade", async () => {
    await expect(listShopUsernames(async () => {
      throw new Error("db down");
    })).rejects.toThrow("db down");
  });
});

describe("handleSitemapRequest", () => {
  it("returns 200 XML with static routes and shop URLs", async () => {
    const response = await handleSitemapRequest({
      listUsernames: async () => ["priya", "threadstudio"],
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(response.headers.get("cache-control")).toContain("max-age=3600");
    const body = await response.text();
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    for (const path of STATIC_SITEMAP_PATHS) {
      expect(body).toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
    expect(body).toContain(`<loc>${SITE_URL}/priya</loc>`);
    expect(body).toContain(`<loc>${SITE_URL}/threadstudio</loc>`);
  });

  it("degrades to static routes only when the listing fails", async () => {
    const response = await handleSitemapRequest({
      listUsernames: async () => {
        throw new Error("db down");
      },
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(`<loc>${SITE_URL}/pricing</loc>`);
    expect(body).not.toContain("/priya</loc>");
  });
});
