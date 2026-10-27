import { useState } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Pencil, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { normalizeUrl } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Tables } from "@/integrations/supabase/types";

export type LinkRow = Tables<"links">;

/**
 * Reorder a filtered subset (e.g. only link rows, or only product/service
 * rows) inside the full row list, keeping the other rows' relative order
 * and reassigning positions across the full list. Returns null when the
 * drag target is not in the subset, so the caller can ignore the drop.
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

/** One editable dashboard row: a link, a shop product, or a service. */
export function DashboardLinkItem({ link, onUpdate, onDelete }: { link: LinkRow; onUpdate: (id: string, p: Partial<LinkRow>) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const isCard = link.kind !== "link";
  const [editing, setEditing] = useState(isCard ? link.title.startsWith("New ") : link.url === "https://");
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [price, setPrice] = useState(link.price ?? "");
  const [desc, setDesc] = useState(link.description ?? "");

  function save() {
    if (isCard) {
      if (!title.trim()) return void toast.error("Add a title");
      onUpdate(link.id, { title: title.trim().slice(0, 80), price: price.trim().slice(0, 30) || null, description: desc.trim().slice(0, 200) || null });
      return void setEditing(false);
    }
    if (!title.trim() || url.trim().length < 4) return void toast.error("Add a title and a URL");
    onUpdate(link.id, { title: title.trim().slice(0, 80), url: normalizeUrl(url) });
    setEditing(false);
  }

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-2xl border bg-background p-4 ${isDragging ? "z-10 shadow-soft" : ""}`}>
      <button {...attributes} {...listeners} className="mt-2 cursor-grab touch-none text-muted-foreground" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            {isCard ? (
              <>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={link.kind === "service" ? "Fee, e.g. ₹500 / session" : "Price, e.g. ₹499"} maxLength={30} />
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description (optional)" maxLength={200} rows={2} />
              </>
            ) : (
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" />
            )}
            <Button size="sm" onClick={save}><Check className="h-4 w-4" /> Save</Button>
          </div>
        ) : (
          <button className="block w-full text-left" onClick={() => setEditing(true)}>
            <p className="flex items-center gap-1.5 truncate font-semibold">{link.title} <Pencil className="h-3.5 w-3.5 text-muted-foreground" /></p>
            <p className="truncate text-sm text-muted-foreground">{isCard ? `${link.kind === "service" ? "Service" : "Product"}${link.price ? ` · ${link.price}` : ""} · WhatsApp button` : link.url}</p>
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Switch checked={link.enabled} onCheckedChange={(v) => onUpdate(link.id, { enabled: v })} aria-label="Show link" />
        <button onClick={() => onDelete(link.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete link"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}
