/**
 * Exclusive page modes — a page is either a link page OR a store/service
 * page, never a mix. The mode is derived from the user's existing rows,
 * so no new database column is needed and nothing is ever deleted here.
 *
 * - "shop": at least one ENABLED product or service row. Links are hidden
 *   from visitors in this mode (legacy links are kept, not deleted).
 * - "links": at least one ENABLED link row and no enabled product/service.
 * - "empty": no enabled rows at all. The first enabled item sets the mode.
 *
 * Rows without an `enabled` field (e.g. public-page data, which is already
 * filtered to enabled rows by the server) are treated as enabled. Rows
 * without a kind are treated as links, matching PublicProfile.
 */
export type PageMode = "empty" | "links" | "shop";

export type PageModeItem = {
  kind?: string | null;
  enabled?: boolean | null;
};

export function getPageMode(items: PageModeItem[]): PageMode {
  const enabled = items.filter((i) => i.enabled !== false);
  if (enabled.some((i) => i.kind === "product" || i.kind === "service")) return "shop";
  if (enabled.some((i) => (i.kind ?? "link") === "link")) return "links";
  return "empty";
}

/** What visitors see on the main public page for the given rows. */
export function visiblePageItems<T extends PageModeItem>(items: T[]): T[] {
  const mode = getPageMode(items);
  if (mode === "shop") return items.filter((i) => i.kind === "product" || i.kind === "service");
  if (mode === "links") return items.filter((i) => (i.kind ?? "link") === "link");
  return [];
}
