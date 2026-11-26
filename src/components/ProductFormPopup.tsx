import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CatalogueDetails, CataloguePhotos } from "@/components/CatalogueEditor";
import { sanitizeOptionLabel, sanitizeOptions } from "@/lib/product-categories";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LinkRow } from "@/components/DashboardLinkItem";

export type ProductFormData = {
  title: string;
  price: string | null;
  description: string | null;
  image_urls: string[];
  category: string | null;
  option_label: string | null;
  options: string[];
};

type FormState = {
  title: string;
  price: string;
  desc: string;
  images: string[];
  category: string;
  optionLabel: string;
  options: string[];
};

const EMPTY: FormState = { title: "", price: "", desc: "", images: [], category: "", optionLabel: "", options: [] };

function fromLink(link: LinkRow): FormState {
  return {
    title: link.title,
    price: link.price ?? "",
    desc: link.description ?? "",
    images: link.image_urls ?? [],
    category: link.category ?? "",
    optionLabel: link.option_label ?? "",
    options: link.options ?? [],
  };
}

/** Turn the form fields into the exact values saved to the row.
 *  Options without a name are dropped, matching the old inline
 *  editor, so a half-built option never reaches the shop page. */
export function buildProductData(s: FormState): ProductFormData {
  const cleanOptions = sanitizeOptions(s.options);
  const cleanLabel = cleanOptions.length > 0 ? sanitizeOptionLabel(s.optionLabel) : null;
  return {
    title: s.title.trim().slice(0, 80),
    price: s.price.trim().slice(0, 30) || null,
    description: s.desc.trim().slice(0, 4000) || null,
    image_urls: s.images,
    category: s.category.trim().slice(0, 60) || null,
    option_label: cleanLabel,
    options: cleanLabel ? cleanOptions : [],
  };
}

/**
 * Add / edit product pop-up — bottom sheet on phone, dialog on
 * desktop. Nothing is saved until Save is tapped: a new product
 * creates no row while the pop-up is open, and Cancel leaves
 * nothing behind. Photos upload to storage when picked (as
 * before), so cancelling after picking photos can leave unused
 * photo files, but never a product row. The Live/Hidden toggle
 * stays on the product card; Delete lives here, two-step, away
 * from Save.
 */
export function ProductFormPopup({ open, onOpenChange, userId, link, onSaveNew, onSaveEdit, onDelete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** null = add a new product; a row = edit that product. */
  link: LinkRow | null;
  onSaveNew: (data: ProductFormData) => void;
  onSaveEdit: (id: string, data: ProductFormData) => void;
  onDelete: (id: string) => void;
}) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTimer = useRef<number | null>(null);

  // Fresh form every time the pop-up opens, from the saved row
  // when editing, so a photo saved earlier shows correctly.
  useEffect(() => {
    if (open) {
      setForm(link ? fromLink(link) : EMPTY);
      setConfirmingDelete(false);
    }
  }, [open, link]);

  useEffect(() => () => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
  }, []);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  function save() {
    if (!form.title.trim()) return void toast.error("Add a title");
    const data = buildProductData(form);
    if (link) onSaveEdit(link.id, data);
    else onSaveNew(data);
    onOpenChange(false);
  }

  // Delete is two-step: the first tap arms "Confirm delete?"
  // (disarms itself after a few seconds); only the second deletes.
  function handleDelete() {
    if (!link) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
      deleteTimer.current = window.setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    onDelete(link.id);
    onOpenChange(false);
  }

  const title = link ? "Edit product" : "Add product";

  const body = (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Product photos</p>
        <CataloguePhotos userId={userId} images={form.images} onImages={(v) => set({ images: v })} onUploadingChange={setPhotosUploading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product-name">Product name</Label>
        <Input id="product-name" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Product name" maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product-price">Price</Label>
        <Input id="product-price" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="Price, e.g. ₹499" maxLength={30} />
        {!form.price.trim() && (
          <p className="text-sm text-muted-foreground">Add a price — products without a price get fewer orders.</p>
        )}
      </div>
      <CatalogueDetails
        category={form.category} onCategory={(v) => set({ category: v })}
        optionLabel={form.optionLabel} onOptionLabel={(v) => set({ optionLabel: v })}
        options={form.options} onOptions={(v) => set({ options: v })}
        description={form.desc} onDescription={(v) => set({ desc: v })}
      />
      {link && (
        <div className="border-t pt-3">
          {confirmingDelete ? (
            <button type="button" onClick={handleDelete} onBlur={() => setConfirmingDelete(false)}
              className="flex min-h-[44px] items-center rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground touch-manipulation">
              Confirm delete?
            </button>
          ) : (
            <button type="button" onClick={handleDelete}
              className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground touch-manipulation hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete product
            </button>
          )}
        </div>
      )}
    </div>
  );

  const actions = (
    <>
      <Button className="min-h-[52px] flex-1 text-base font-semibold" onClick={save} disabled={photosUploading}>
        <Check className="h-4 w-4" /> {photosUploading ? "Uploading photos…" : link ? "Save product" : "Save product"}
      </Button>
      <Button variant="outline" className="min-h-[52px] px-5" onClick={() => onOpenChange(false)}>
        <X className="h-4 w-4" /> Cancel
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">{body}</div>
          <DrawerFooter className="border-t">
            <div className="flex gap-2">{actions}</div>
            {!link && <p className="text-center text-sm text-muted-foreground">Nothing is saved until you tap Save product.</p>}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{body}</div>
        <DialogFooter className="flex-row gap-2 border-t pt-3">
          {actions}
        </DialogFooter>
        {!link && <p className="text-center text-sm text-muted-foreground">Nothing is saved until you tap Save product.</p>}
      </DialogContent>
    </Dialog>
  );
}
