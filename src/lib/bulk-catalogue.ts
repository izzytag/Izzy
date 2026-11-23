import { CATALOGUE_PHOTO_LIMIT } from "@/lib/catalogue";
import { FREE_LINK_LIMIT } from "@/lib/themes";

/**
 * Bulk photo catalogue (manual grouping, no AI).
 *
 * A seller dumps many product photos at once. Exact duplicate files are
 * flagged by a SHA-256 hash of the original bytes, the seller groups
 * photos into products by tapping them, edits name/price/description
 * per group, and only then publishes. Drafts live in local component
 * state until Publish — no `links` row is created before then, so an
 * unfinished draft never counts toward the Free item limit and never
 * appears on the public shop.
 */

export type BulkPhoto = {
  id: string;
  /** SHA-256 of the original file bytes; null when hashing is unavailable. */
  hash: string | null;
  /** Signed URL of the processed photo in the `catalogue` bucket. */
  url: string;
  fileName: string;
};

export type BulkGroup = {
  id: string;
  photoIds: string[];
  title: string;
  price: string;
  description: string;
  category: string;
};

export const MAX_PHOTOS_PER_GROUP = CATALOGUE_PHOTO_LIMIT;

export function newGroup(photoIds: string[]): BulkGroup {
  return { id: crypto.randomUUID(), photoIds, title: "", price: "", description: "", category: "" };
}

/** SHA-256 of file bytes, as a hex string. */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Split freshly picked photos into kept photos and exact duplicates.
 * A photo is a duplicate when its hash was already seen (in this batch
 * or in an earlier pick this session). Photos without a hash are never
 * treated as duplicates — they are always kept. Returns the updated set
 * of seen hashes so the caller can carry it into the next pick.
 */
export function dedupeByHash<T extends { hash: string | null }>(
  items: T[],
  seenHashes: Set<string>,
): { kept: T[]; removedCount: number; seenHashes: Set<string> } {
  const seen = new Set(seenHashes);
  const kept: T[] = [];
  let removedCount = 0;
  for (const item of items) {
    if (item.hash && seen.has(item.hash)) {
      removedCount += 1;
      continue;
    }
    if (item.hash) seen.add(item.hash);
    kept.push(item);
  }
  return { kept, removedCount, seenHashes: seen };
}

/** Photos not assigned to any group yet. */
export function ungroupedPhotos(photos: BulkPhoto[], groups: BulkGroup[]): BulkPhoto[] {
  const grouped = new Set(groups.flatMap((g) => g.photoIds));
  return photos.filter((p) => !grouped.has(p.id));
}

/** A group is ready to publish when it has at least one photo and a name. */
export function validateGroup(group: BulkGroup): string | null {
  if (group.photoIds.length === 0) return "Each product needs at least one photo.";
  if (!group.title.trim()) return "Add a name for every product before publishing.";
  return null;
}

export function readyGroups(groups: BulkGroup[]): BulkGroup[] {
  return groups.filter((g) => validateGroup(g) === null);
}

/** How many more products this seller can publish: unlimited on Pro. */
export function freeSlots(existingItemCount: number, isPro: boolean): number {
  if (isPro) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_LINK_LIMIT - existingItemCount);
}

/**
 * Split ready groups into the ones that can go live now and the ones
 * that must stay as drafts under the Free limit. Order is kept: the
 * first groups the seller made are published first.
 */
export function splitForPublish<T>(
  groups: T[],
  existingItemCount: number,
  isPro: boolean,
): {
  toPublish: T[];
  heldBack: T[];
} {
  const slots = freeSlots(existingItemCount, isPro);
  return { toPublish: groups.slice(0, slots), heldBack: groups.slice(slots) };
}

export function groupPhotoUrls(group: BulkGroup, photos: BulkPhoto[]): string[] {
  const byId = new Map(photos.map((p) => [p.id, p.url]));
  return group.photoIds.map((id) => byId.get(id)).filter((u): u is string => Boolean(u));
}

/** The `links` row a published group becomes. Same shape and field
 *  limits as a product added one at a time (see DashboardLinkItem):
 *  title 80, price 30, description 4000, category 60, kind product,
 *  enabled true because Publish is the seller's explicit go-live tap. */
export function buildProductInsert(args: {
  userId: string;
  group: BulkGroup;
  imageUrls: string[];
  position: number;
}) {
  const { group } = args;
  return {
    user_id: args.userId,
    kind: "product",
    title: group.title.trim().slice(0, 80),
    url: "",
    price: group.price.trim().slice(0, 30) || null,
    description: group.description.trim().slice(0, 4000) || null,
    category: group.category.trim().slice(0, 60) || null,
    image_urls: args.imageUrls.slice(0, MAX_PHOTOS_PER_GROUP),
    position: args.position,
    enabled: true,
  };
}
