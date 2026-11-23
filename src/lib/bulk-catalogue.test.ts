import { describe, expect, it } from "vitest";
import {
  buildProductInsert,
  dedupeByHash,
  freeSlots,
  newGroup,
  readyGroups,
  sha256Hex,
  splitForPublish,
  ungroupedPhotos,
  validateGroup,
  type BulkGroup,
  type BulkPhoto,
} from "@/lib/bulk-catalogue";

function textBuffer(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer as ArrayBuffer;
}

function photo(id: string, hash: string | null): BulkPhoto {
  return { id, hash, url: `https://example.test/${id}.jpg`, fileName: `${id}.jpg` };
}

function group(photoIds: string[], title = "Cake"): BulkGroup {
  return { ...newGroup(photoIds), title, price: "₹499", description: "Fresh", category: "Bakery" };
}

describe("sha256Hex", () => {
  it("matches the known SHA-256 vector for 'abc'", async () => {
    await expect(sha256Hex(textBuffer("abc"))).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gives different hashes for different bytes", async () => {
    const a = await sha256Hex(textBuffer("photo-one"));
    const b = await sha256Hex(textBuffer("photo-two"));
    expect(a).not.toBe(b);
  });
});

describe("dedupeByHash", () => {
  it("removes an exact duplicate and keeps the first copy", () => {
    const seen = new Set(["hash-a"]);
    const { kept, removedCount, seenHashes } = dedupeByHash(
      [photo("p1", "hash-a"), photo("p2", "hash-b"), photo("p3", "hash-b")],
      seen,
    );
    expect(kept.map((p) => p.id)).toEqual(["p2"]);
    expect(removedCount).toBe(2);
    expect(seenHashes.has("hash-b")).toBe(true);
  });

  it("never treats a photo without a hash as a duplicate", () => {
    const { kept, removedCount } = dedupeByHash([photo("p1", null), photo("p2", null)], new Set());
    expect(kept).toHaveLength(2);
    expect(removedCount).toBe(0);
  });

  it("carries seen hashes into the next pick", () => {
    const first = dedupeByHash([photo("p1", "hash-a")], new Set());
    const second = dedupeByHash([photo("p2", "hash-a")], first.seenHashes);
    expect(second.kept).toHaveLength(0);
    expect(second.removedCount).toBe(1);
  });
});

describe("grouping", () => {
  it("ungroupedPhotos returns only photos in no group", () => {
    const photos = [photo("p1", "a"), photo("p2", "b"), photo("p3", "c")];
    const groups = [group(["p1"])];
    expect(ungroupedPhotos(photos, groups).map((p) => p.id)).toEqual(["p2", "p3"]);
  });

  it("a group needs a photo and a name", () => {
    expect(validateGroup({ ...newGroup(["p1"]), title: "" })).toBe(
      "Add a name for every product before publishing.",
    );
    expect(validateGroup({ ...newGroup([]), title: "Cake" })).toBe(
      "Each product needs at least one photo.",
    );
    expect(validateGroup(group(["p1"]))).toBeNull();
  });

  it("readyGroups keeps only valid groups", () => {
    const groups = [group(["p1"]), { ...newGroup(["p2"]), title: "" }];
    expect(readyGroups(groups)).toHaveLength(1);
  });
});

describe("free limit", () => {
  it("Free with 3 items has 2 slots", () => {
    expect(freeSlots(3, false)).toBe(2);
  });

  it("Free with 5 items has 0 slots", () => {
    expect(freeSlots(5, false)).toBe(0);
  });

  it("Pro has unlimited slots", () => {
    expect(freeSlots(99, true)).toBe(Number.POSITIVE_INFINITY);
  });

  it("publishes the first groups and holds the rest back on Free", () => {
    const groups = [1, 2, 3, 4, 5].map((n) => `g${n}`);
    const { toPublish, heldBack } = splitForPublish(groups, 3, false);
    expect(toPublish).toEqual(["g1", "g2"]);
    expect(heldBack).toEqual(["g3", "g4", "g5"]);
  });

  it("publishes everything on Pro", () => {
    const { toPublish, heldBack } = splitForPublish(["g1", "g2"], 5, true);
    expect(toPublish).toEqual(["g1", "g2"]);
    expect(heldBack).toEqual([]);
  });
});

describe("buildProductInsert", () => {
  it("builds a live product row with the single-add field limits", () => {
    const row = buildProductInsert({
      userId: "user-1",
      group: {
        ...group(["p1", "p2"]),
        title: `  ${"A".repeat(100)}  `,
        price: `  ${"9".repeat(40)}  `,
        description: "  Fresh cake  ",
        category: "  Bakery  ",
      },
      imageUrls: ["u1", "u2"],
      position: 7,
    });
    expect(row).toEqual({
      user_id: "user-1",
      kind: "product",
      title: "A".repeat(80),
      url: "",
      price: "9".repeat(30),
      description: "Fresh cake",
      category: "Bakery",
      image_urls: ["u1", "u2"],
      position: 7,
      enabled: true,
    });
  });

  it("turns blank price, description and category into null", () => {
    const row = buildProductInsert({
      userId: "user-1",
      group: { ...newGroup(["p1"]), title: "Cake", price: "  ", description: "", category: "" },
      imageUrls: ["u1"],
      position: 0,
    });
    expect(row.price).toBeNull();
    expect(row.description).toBeNull();
    expect(row.category).toBeNull();
  });
});
