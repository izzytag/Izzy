import { GripVertical, Pencil } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";
import type { Tables } from "@/integrations/supabase/types";

export type LinkRow = Tables<"links">;

/**
 * Reorder a filtered subset (e.g. only the store's product
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

/** One dashboard card: a shop product.
 *  Cards match the Home tab product look — big square photo,
 *  name and price — with a Live/Hidden toggle on each card.
 *  Tapping the card opens the Add/Edit product pop-up (owned by
 *  the Products page); editing and deleting happen there, so the
 *  card itself stays simple. hasWhatsApp only steers the summary
 *  copy below. */
export function DashboardLinkItem({ link, onUpdate, onEdit, hasWhatsApp = false }: {
  link: LinkRow;
  onUpdate: (id: string, p: Partial<LinkRow>) => void;
  onEdit: (link: LinkRow) => void;
  hasWhatsApp?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const photoNote = link.image_urls?.length
    ? `${link.image_urls.length} photo${link.image_urls.length === 1 ? "" : "s"}`
    : "No photo yet";
  const summary = `Product · ${photoNote}${hasWhatsApp ? " · WhatsApp button" : ""}`;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-background ${isDragging ? "z-10 shadow-soft" : ""}`}>
      <button {...attributes} {...listeners} className="absolute left-1 top-1 z-10 flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
      <button className="block w-full touch-manipulation text-left" onClick={() => onEdit(link)} aria-label={`Edit ${link.title}`}>
        {link.image_urls?.[0]
          ? <img src={link.image_urls[0]} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
          : <span className="flex aspect-square w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">{(link.title || "?")[0]?.toUpperCase()}</span>}
        <span className="block p-3 pb-1">
          <span className="flex items-center gap-1.5 truncate font-semibold">{link.title} <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></span>
          {link.price
            ? <span className="block truncate text-base font-bold">{link.price}</span>
            : <span className="block truncate text-sm text-muted-foreground">No price yet</span>}
          <span className="block truncate text-sm text-muted-foreground">{summary}</span>
        </span>
      </button>
      <div className="mt-auto border-t px-3 py-1">
        <div className="flex min-h-[44px] items-center justify-between gap-2">
          <span className="text-sm font-semibold">{link.enabled ? "Live" : "Hidden"}</span>
          <Switch checked={link.enabled} onCheckedChange={(v) => onUpdate(link.id, { enabled: v })} aria-label="Show product" />
        </div>
      </div>
    </li>
  );
}
