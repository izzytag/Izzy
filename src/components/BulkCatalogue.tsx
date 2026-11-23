import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Images, Layers, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processCataloguePhoto } from "@/lib/catalogue";
import { FREE_LINK_LIMIT } from "@/lib/themes";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import {
  buildProductInsert,
  dedupeByHash,
  freeSlots,
  groupPhotoUrls,
  MAX_PHOTOS_PER_GROUP,
  newGroup,
  readyGroups,
  sha256Hex,
  splitForPublish,
  ungroupedPhotos,
  validateGroup,
  type BulkGroup,
  type BulkPhoto,
} from "@/lib/bulk-catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Bulk photo catalogue, manual grouping, no AI.
 *
 * Flow: choose many photos at once -> exact duplicates are removed ->
 * tap photos to group them into one product (up to 4 photos) -> name
 * and price each group -> Publish. Drafts are held in local state
 * until Publish, so nothing unfinished counts toward the Free item
 * limit and nothing appears on the public shop before the seller
 * chooses to publish it.
 */
export function BulkCatalogue({
  userId,
  existingItemCount,
  totalLinksCount,
  isPro,
  onPublished,
}: {
  userId: string;
  /** Product + service rows already saved (drafts and live). */
  existingItemCount: number;
  /** All saved rows, used only to place new products at the end. */
  totalLinksCount: number;
  isPro: boolean;
  onPublished: () => void;
}) {
  const region = useRegion();
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<BulkPhoto[]>([]);
  const [groups, setGroups] = useState<BulkGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [seenHashes, setSeenHashes] = useState<Set<string>>(new Set());
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [heldBackNote, setHeldBackNote] = useState<string | null>(null);

  const ungrouped = ungroupedPhotos(photos, groups);
  const ready = readyGroups(groups);
  const slots = freeSlots(existingItemCount, isPro);
  const publishable = Math.min(ready.length, slots);
  const ungroupedCount = ungrouped.length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function uploadFiles(files: FileList) {
    const picked = Array.from(files);
    if (!picked.length) return;
    setUploading(true);
    setProgress({ done: 0, total: picked.length });
    try {
      // Hash the original bytes first: exact duplicates are dropped
      // before any upload, so the same photo is never uploaded twice.
      const hashed: { file: File; hash: string | null }[] = [];
      for (const file of picked) {
        let hash: string | null = null;
        try {
          hash = await sha256Hex(await file.arrayBuffer());
        } catch {
          hash = null; // Hashing unavailable — keep the photo, skip dedupe.
        }
        hashed.push({ file, hash });
      }
      const { kept, removedCount, seenHashes: nextSeen } = dedupeByHash(hashed, seenHashes);
      setSeenHashes(nextSeen);
      if (removedCount > 0) {
        setDuplicatesRemoved((n) => n + removedCount);
        toast.success(
          `${removedCount} duplicate ${removedCount === 1 ? "photo" : "photos"} removed — the same photo was picked twice.`,
        );
      }
      let done = 0;
      let failed = 0;
      const uploaded: BulkPhoto[] = [];
      for (const { file } of kept) {
        try {
          // Same in-browser pipeline as a single product photo: phone
          // photos are shrunk to at most 1600px and re-encoded as JPEG
          // until they fit the 2MB limit, instead of being rejected.
          const processed = await processCataloguePhoto(file);
          const path = `${userId}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("catalogue")
            .upload(path, processed, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;
          const { data, error: signError } = await supabase.storage
            .from("catalogue")
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
          if (signError || !data) throw signError || new Error("Couldn't prepare the photo.");
          uploaded.push({
            id: crypto.randomUUID(),
            hash: hashed.find((h) => h.file === file)?.hash ?? null,
            url: data.signedUrl,
            fileName: file.name,
          });
        } catch (e) {
          failed += 1;
          toast.error(
            e instanceof Error ? e.message : "Couldn't upload a photo. Please try again.",
          );
        }
        done += 1;
        setProgress({ done, total: picked.length });
      }
      if (uploaded.length) setPhotos((prev) => [...prev, ...uploaded]);
      if (failed > 0)
        toast.error(`${failed} ${failed === 1 ? "photo" : "photos"} could not be uploaded.`);
    } finally {
      setUploading(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  function groupSelected() {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > MAX_PHOTOS_PER_GROUP) {
      return void toast.error(`Group up to ${MAX_PHOTOS_PER_GROUP} photos into one product.`);
    }
    setGroups((prev) => [...prev, newGroup(selectedIds)]);
    setSelectedIds([]);
  }

  function addSelectedToGroup(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group || selectedIds.length === 0) return;
    const room = MAX_PHOTOS_PER_GROUP - group.photoIds.length;
    if (room <= 0)
      return void toast.error(`Each product holds up to ${MAX_PHOTOS_PER_GROUP} photos.`);
    const adding = selectedIds.slice(0, room);
    if (adding.length < selectedIds.length) {
      toast.error(`Only ${room} more ${room === 1 ? "photo fits" : "photos fit"} in this product.`);
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, photoIds: [...g.photoIds, ...adding] } : g)),
    );
    setSelectedIds((prev) => prev.filter((id) => !adding.includes(id)));
  }

  function updateGroup(groupId: string, patch: Partial<BulkGroup>) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  }

  function removePhotoFromGroup(groupId: string, photoId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, photoIds: g.photoIds.filter((id) => id !== photoId) } : g,
      ),
    );
  }

  function ungroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  function deletePhoto(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelectedIds((prev) => prev.filter((id) => id !== photoId));
  }

  async function publish() {
    if (publishing) return;
    const readyNow = readyGroups(groups);
    const notReady = groups.length - readyNow.length;
    if (readyNow.length === 0) {
      const firstProblem = groups.map(validateGroup).find(Boolean);
      return void toast.error(firstProblem ?? "Add a photo and a name for each product first.");
    }
    const { toPublish, heldBack } = splitForPublish(readyNow, existingItemCount, isPro);
    if (toPublish.length === 0) {
      return void toast.error(
        `Free plan allows ${FREE_LINK_LIMIT} items. Upgrade to Pro for unlimited items.`,
      );
    }
    setPublishing(true);
    setHeldBackNote(null);
    let published = 0;
    try {
      for (const [index, group] of toPublish.entries()) {
        const urls = groupPhotoUrls(group, photos);
        if (urls.length === 0) continue;
        const { error } = await supabase.from("links").insert(
          buildProductInsert({
            userId,
            group,
            imageUrls: urls,
            position: totalLinksCount + index,
          }),
        );
        if (error) {
          const hitLimit = /limit|maximum|free plan/i.test(error.message);
          toast.error(
            hitLimit
              ? "You've reached the free plan limit. Upgrade to Pro for unlimited items."
              : "Couldn't publish a product — please try again.",
          );
          break;
        }
        published += 1;
      }
    } finally {
      setPublishing(false);
    }
    if (published === 0) return;
    const publishedIds = new Set(toPublish.slice(0, published).map((g) => g.id));
    setGroups((prev) => prev.filter((g) => !publishedIds.has(g.id)));
    setSelectedIds([]);
    onPublished();
    toast.success(
      `${published} ${published === 1 ? "product is" : "products are"} now live on your shop.`,
    );
    const parts: string[] = [];
    if (notReady > 0)
      parts.push(
        `${notReady} ${notReady === 1 ? "product still needs" : "products still need"} a name and ${notReady === 1 ? "stays" : "stay"} as drafts.`,
      );
    if (heldBack.length > 0)
      parts.push(
        `${heldBack.length} ${heldBack.length === 1 ? "product stays" : "products stay"} as drafts — the Free plan allows ${FREE_LINK_LIMIT} items.`,
      );
    setHeldBackNote(parts.length ? parts.join(" ") : null);
  }

  const photoById = new Map(photos.map((p) => [p.id, p]));

  return (
    <div className="space-y-5 rounded-xl border-2 border-primary/30 bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-bold">Upload photos in bulk</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Choose many photos at once. Group the photos that belong to one product, add a name and
          price for each group, then publish. Nothing goes live until you publish.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="min-h-[48px]"
        >
          <Upload className="h-4 w-4" />{" "}
          {uploading && progress
            ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`
            : "Choose photos"}
        </Button>
        <input
          ref={input}
          hidden
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          aria-label="Choose product photos"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />
        <p className="text-sm text-muted-foreground">
          Big phone photos are shrunk automatically. Up to {MAX_PHOTOS_PER_GROUP} photos per
          product.
        </p>
      </div>
      {uploading && progress && (
        <p role="status" className="text-sm text-muted-foreground">
          Uploading photo {Math.min(progress.done + 1, progress.total)} of {progress.total}. Please
          wait — your photos are being prepared.
        </p>
      )}
      {duplicatesRemoved > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          {duplicatesRemoved} duplicate {duplicatesRemoved === 1 ? "photo" : "photos"} removed — the
          same photo was picked twice.
        </p>
      )}

      {photos.length > 0 && (
        <>
          <section>
            <h3 className="font-semibold">Photos not grouped yet ({ungroupedCount})</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tap photos to select them, then group them into one product.
            </p>
            {ungroupedCount === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                All photos are grouped. Choose more photos, or publish below.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {ungrouped.map((photo) => {
                  const order = selectedIds.indexOf(photo.id);
                  const selected = order !== -1;
                  return (
                    <div
                      key={photo.id}
                      className={`relative aspect-square overflow-hidden rounded-lg border bg-muted ${selected ? "ring-2 ring-primary" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelect(photo.id)}
                        aria-pressed={selected}
                        aria-label={
                          selected
                            ? `Deselect photo ${photo.fileName}`
                            : `Select photo ${photo.fileName}`
                        }
                        className="block h-full w-full"
                      >
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        {selected && (
                          <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {order + 1}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                        aria-label={`Delete photo ${photo.fileName}`}
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              variant="outline"
              onClick={groupSelected}
              disabled={selectedIds.length === 0 || selectedIds.length > MAX_PHOTOS_PER_GROUP}
              className="mt-3 min-h-[44px]"
            >
              <Layers className="h-4 w-4" /> Group selected into one product ({selectedIds.length}{" "}
              selected)
            </Button>
            {selectedIds.length > MAX_PHOTOS_PER_GROUP && (
              <p className="mt-2 text-sm text-muted-foreground">
                Select up to {MAX_PHOTOS_PER_GROUP} photos for one product.
              </p>
            )}
          </section>

          {groups.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-semibold">Your products ({groups.length})</h3>
              {groups.map((group, index) => {
                const error = validateGroup(group);
                return (
                  <div key={group.id} className="space-y-3 rounded-xl border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">
                        Product {index + 1} · {group.photoIds.length}{" "}
                        {group.photoIds.length === 1 ? "photo" : "photos"}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => ungroup(group.id)}>
                        Ungroup
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {group.photoIds.map((photoId) => {
                        const photo = photoById.get(photoId);
                        if (!photo) return null;
                        return (
                          <div
                            key={photoId}
                            className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                          >
                            <img src={photo.url} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhotoFromGroup(group.id, photoId)}
                              aria-label={`Remove this photo from product ${index + 1}`}
                              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {selectedIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSelectedToGroup(group.id)}
                        disabled={group.photoIds.length >= MAX_PHOTOS_PER_GROUP}
                      >
                        <Plus className="h-4 w-4" /> Add selected photos to this product
                      </Button>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor={`bulk-title-${group.id}`}>Name</Label>
                      <Input
                        id={`bulk-title-${group.id}`}
                        value={group.title}
                        onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                        placeholder="Product name, e.g. Chocolate Truffle Cake 500g"
                        maxLength={80}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`bulk-price-${group.id}`}>Price</Label>
                        <Input
                          id={`bulk-price-${group.id}`}
                          value={group.price}
                          onChange={(e) => updateGroup(group.id, { price: e.target.value })}
                          placeholder="Price, e.g. ₹499"
                          maxLength={30}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`bulk-category-${group.id}`}>Category</Label>
                        <Input
                          id={`bulk-category-${group.id}`}
                          value={group.category}
                          onChange={(e) => updateGroup(group.id, { category: e.target.value })}
                          placeholder="Category (optional)"
                          maxLength={60}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bulk-desc-${group.id}`}>Description</Label>
                      <Textarea
                        id={`bulk-desc-${group.id}`}
                        value={group.description}
                        onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                        placeholder="Full details: sizes, materials, delivery, or what this includes"
                        maxLength={4000}
                        rows={3}
                      />
                    </div>
                    {error && <p className="text-sm text-muted-foreground">{error}</p>}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => {
                        group.photoIds.forEach((id) => deletePhoto(id));
                        ungroup(group.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete this product and its photos
                    </Button>
                  </div>
                );
              })}
            </section>
          )}

          {groups.length > 0 && (
            <div className="space-y-2 rounded-xl bg-primary-soft p-4">
              <p className="text-sm text-accent-foreground">
                {isPro
                  ? `${ready.length} ${ready.length === 1 ? "product is" : "products are"} ready to publish.`
                  : `${existingItemCount} of ${FREE_LINK_LIMIT} free items used. ${publishable} ${publishable === 1 ? "product" : "products"} can go live now — the rest stay as drafts.`}
                {groups.length - ready.length > 0 &&
                  ` ${groups.length - ready.length} ${groups.length - ready.length === 1 ? "product still needs" : "products still need"} a name.`}
              </p>
              <Button
                onClick={() => void publish()}
                disabled={publishing || ready.length === 0 || publishable === 0}
                className="min-h-[48px] w-full"
              >
                <Check className="h-4 w-4" />{" "}
                {publishing
                  ? "Publishing…"
                  : `Publish ${publishable} ${publishable === 1 ? "product" : "products"}`}
              </Button>
              {heldBackNote && <p className="text-sm text-accent-foreground">{heldBackNote}</p>}
              {!isPro && ready.length > slots && (
                <p className="text-sm text-accent-foreground">
                  <Link to="/dashboard/upgrade" className="font-semibold underline">
                    Go Pro ({proPriceLine(region)})
                  </Link>{" "}
                  for unlimited items.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {photos.length === 0 && !uploading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Images className="h-4 w-4" /> No photos yet. Choose photos from your phone to start — for
          example, 20 photos for 10 products.
        </p>
      )}
    </div>
  );
}
