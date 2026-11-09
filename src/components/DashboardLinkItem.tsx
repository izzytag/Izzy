import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Pencil, Check, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CatalogueEditor } from "@/components/CatalogueEditor";
import type { Tables } from "@/integrations/supabase/types";

export type LinkRow = Tables<"links">;

/**
 * Reorder a filtered subset (e.g. only the store's product/service
 * rows) inside the full row list, keeping the other rows' relative
 * order and reassigning positions across the full list. Returns null
 * when the drag target is not in the subset, so the caller can ignore
 * the drop.
 */
export function reorderSubset<T extends { id: string; position: number }>(
  full: T[],
  subset: T[],
  activeId: string,
  overId: string,
): T[] | null {
  const oldI = subset.findIndex((l) => l.id === activeId);
  const newI = subset.findIndex((l) => l.id === overId);
  if (oldI === -1 || newI === -1) return null;
  const moved = [...subset];
  const [item] = moved.splice(oldI, 1);
  moved.splice(newI, 0, item);
  const subsetIds = new Set(subset.map((l) => l.id));
  let j = 0;
  return full
    .map((l) => (subsetIds.has(l.id) ? moved[j++] : l))
    .map((l, i) => ({ ...l, position: i }));
}

/** One editable dashboard row: a shop product or a service.
 *  The edit view includes the product photo editor (CatalogueEditor):
 *  photos upload to the "catalogue" bucket when picked, and Save
 *  persists the resulting URLs plus the category to the row.
 *  Rows open in edit mode only when they were just created
 *  (justCreated); hasWhatsApp only steers the summary copy below. */
export function DashboardLinkItem({ link, onUpdate, onDelete, userId, justCreated = false, hasWhatsApp = false }: {
  link: LinkRow;
  onUpdate: (id: string, p: Partial<LinkRow>) => void;
  onDelete: (id: string) => void;
  userId: string;
  justCreated?: boolean;
  hasWhatsApp?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const kindLabel = link.kind === "service" ? "Service" : "Product";
  const [editing, setEditing] = useState(justCreated);
  const [title, setTitle] = useState(link.title);
  const [price, setPrice] = useState(link.price ?? "");
  const [desc, setDesc] = useState(link.description ?? "");
  const [images, setImages] = useState<string[]>(link.image_urls ?? []);
  const [category, setCategory] = useState(link.category ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
  }, []);

  // Re-sync local edit state from the saved row whenever editing starts,
  // so a photo saved earlier (or removed) shows correctly on re-edit
  // instead of stale state from the previous edit session.
  function startEditing() {
    setTitle(link.title);
    setPrice(link.price ?? "");
    setDesc(link.description ?? "");
    setImages(link.image_urls ?? []);
    setCategory(link.category ?? "");
    setEditing(true);
  }

  // Cancel throws the local edits away and closes the form; the saved
  // row (and its position in the list) is left exactly as it was.
  function cancel() {
    setTitle(link.title);
    setPrice(link.price ?? "");
    setDesc(link.description ?? "");
    setImages(link.image_urls ?? []);
    setCategory(link.category ?? "");
    setEditing(false);
  }

  function save() {
    if (!title.trim()) return void toast.error("Add a title");
    onUpdate(link.id, { title: title.trim().slice(0, 80), price: price.trim().slice(0, 30) || null, description: desc.trim().slice(0, 4000) || null, image_urls: images, category: category.trim().slice(0, 60) || null });
    setEditing(false);
  }

  // Delete is two-step: the first tap arms a "Confirm delete?" state
  // (which disarms itself after a few seconds); only the second tap
  // actually deletes, so a stray tap next to the switch is harmless.
  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
      deleteTimer.current = window.setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    onDelete(link.id);
  }

  const summary = `${kindLabel}${link.price ? ` · ${link.price}` : " · No price yet"}${link.image_urls?.length ? ` · ${link.image_urls.length} photo${link.image_urls.length === 1 ? "" : "s"}` : " · No photo yet"}${hasWhatsApp ? " · WhatsApp button" : ""}`;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-2xl border bg-background p-4 ${isDragging ? "z-10 shadow-soft" : ""}`}>
      <button {...attributes} {...listeners} className="mt-2 cursor-grab touch-none text-muted-foreground" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={link.kind === "service" ? "Fee, e.g. ₹500 / session" : "Price, e.g. ₹499"} maxLength={30} />
            {!price.trim() && (
              <p className="text-sm text-muted-foreground">{link.kind === "service" ? "Add a fee — services without a price get fewer bookings." : "Add a price — products without a price get fewer orders."}</p>
            )}
            <p className="pt-1 text-sm font-medium">Product photos</p>
            <p className="text-sm text-muted-foreground">Add up to 4 photos — big phone photos are shrunk automatically. The first photo is the one shown on the product card in your store.</p>
            <CatalogueEditor userId={userId} images={images} onImages={setImages} category={category} onCategory={setCategory} description={desc} onDescription={setDesc} />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}><Check className="h-4 w-4" /> Save</Button>
              <Button size="sm" variant="outline" onClick={cancel}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </div>
        ) : (
          <button className="block w-full text-left" onClick={startEditing}>
            <p className="flex items-center gap-1.5 truncate font-semibold">{link.title} <Pencil className="h-3.5 w-3.5 text-muted-foreground" /></p>
            <p className="truncate text-sm text-muted-foreground">{summary}</p>
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Switch checked={link.enabled} onCheckedChange={(v) => onUpdate(link.id, { enabled: v })} aria-label={`Show ${kindLabel.toLowerCase()}`} />
        {confirmingDelete ? (
          <button onClick={handleDelete} onBlur={() => setConfirmingDelete(false)} className="whitespace-nowrap rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground" aria-label={`Confirm delete ${kindLabel.toLowerCase()}`}>Confirm delete?</button>
        ) : (
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${kindLabel.toLowerCase()}`}><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
    </li>
  );
}
