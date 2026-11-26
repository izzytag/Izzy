import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATALOGUE_PHOTO_LIMIT, processCataloguePhoto, validateCataloguePhoto } from "@/lib/catalogue";
import {
  PRODUCT_CATEGORIES, presetForCategory, addOptionChoice, removeOptionChoice, sanitizeOptions,
} from "@/lib/product-categories";

export function CatalogueEditor({ userId, images, onImages, category, onCategory, optionLabel, onOptionLabel, options, onOptions, description, onDescription, onUploadingChange }: {
  userId: string; images: string[]; onImages: (v: string[]) => void;
  category: string; onCategory: (v: string) => void;
  optionLabel: string; onOptionLabel: (v: string) => void;
  options: string[]; onOptions: (v: string[]) => void;
  description: string; onDescription: (v: string) => void;
  /** Lets the parent disable Save while a photo upload is in flight,
      so a save can never land before its photos do. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [customChoice, setCustomChoice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  function setUploadingState(v: boolean) {
    setUploading(v);
    onUploadingChange?.(v);
  }

  // Picked photos are processed in the browser first (downscaled and
  // re-encoded as JPEG), so ordinary phone photos — big files included —
  // upload fine instead of being rejected for size or format.
  async function uploadFiles(files: FileList) {
    const picked = Array.from(files);
    if (!picked.length) return;
    const limitError = validateCataloguePhoto(images.length);
    if (limitError) return void toast.error(limitError);
    setUploadingState(true);
    setProgress({ done: 0, total: picked.length });
    let next = [...images];
    let done = 0;
    try {
      for (const file of picked) {
        if (next.length >= CATALOGUE_PHOTO_LIMIT) {
          toast.error(`You can add up to ${CATALOGUE_PHOTO_LIMIT} photos per item.`);
          break;
        }
        try {
          const processed = await processCataloguePhoto(file);
          const path = `${userId}/${crypto.randomUUID()}.jpg`;
          const bucket = supabase.storage.from("catalogue");
          const { error: uploadError } = await bucket.upload(path, processed, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;
          const { data, error: signError } = await bucket.createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
          if (signError || !data) throw signError || new Error("Couldn't prepare the photo.");
          next = [...next, data.signedUrl];
          onImages(next);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Couldn't upload the photo. Please try again.");
        }
        done += 1;
        setProgress({ done, total: picked.length });
      }
    } finally {
      setUploadingState(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }
  const currentPhoto = progress ? Math.min(progress.done + 1, progress.total) : 1;
  return <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2">
      {images.map((src, i) => <div key={src} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <img loading="lazy" decoding="async" src={src} alt={`Item photo ${i + 1}`} className="h-full w-full object-cover" />
        <Button type="button" size="icon" variant="secondary" className="absolute right-1 top-1 h-8 w-8" aria-label={`Remove photo ${i + 1}`} onClick={() => onImages(images.filter((_, index) => index !== i))}><X /></Button>
      </div>)}
      {images.length < CATALOGUE_PHOTO_LIMIT && <Button type="button" variant="outline" disabled={uploading} className="h-auto min-h-16 aspect-square flex-col gap-1 px-1 text-xs" onClick={() => input.current?.click()}>
        {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />} {uploading && progress ? `Uploading ${currentPhoto} of ${progress.total}` : uploading ? "Uploading" : "Add photo"}
      </Button>}
    </div>
    {uploading && progress && (
      <p role="status" className="text-sm text-muted-foreground">Uploading photo {currentPhoto} of {progress.total}. Saving is paused until the upload completes.</p>
    )}
    <input ref={input} hidden type="file" accept="image/*" multiple aria-label="Upload item photos" onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); }} />
    <div className="space-y-2">
      <Label>Category <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <p className="text-sm text-muted-foreground">Tap one category. The right option appears below — for example, sizes for clothes or volume for liquids. Skip this and the product saves as before.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Product category">
        <button type="button" aria-pressed={!category} onClick={() => { onCategory(""); onOptionLabel(""); onOptions([]); }}
          className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition ${!category ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
          No category
        </button>
        {PRODUCT_CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={category === c}
            onClick={() => {
              onCategory(c);
              const preset = presetForCategory(c);
              // Only replace the option when the seller has not built
              // their own yet, or when switching category entirely.
              if (category !== c) {
                onOptionLabel(preset.optionLabel ?? "");
                onOptions(preset.options);
              }
            }}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition ${category === c ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>
      {category && !PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number]) && (
        <p className="text-sm text-muted-foreground">Saved category: {category}. Tap a category above to change it.</p>
      )}
    </div>
    {category && (
      <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-option-label`}>Option name</Label>
          <Input id={`${uid}-option-label`} value={optionLabel} onChange={(e) => onOptionLabel(e.target.value)}
            placeholder={category === "Other" ? "e.g. Colour, Phone model" : "e.g. Size, Volume, Weight"} maxLength={30} />
          <p className="text-sm text-muted-foreground">Buyers pick one choice on your shop page. Leave the name empty for no option.</p>
        </div>
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Option choices">
            {options.map((choice) => (
              <span key={choice} className="inline-flex min-h-[44px] items-center gap-1 rounded-full border bg-background py-1 pl-4 pr-1 text-sm font-semibold">
                {choice}
                <button type="button" aria-label={`Remove ${choice}`} onClick={() => onOptions(removeOptionChoice(options, choice))}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={customChoice} onChange={(e) => setCustomChoice(e.target.value)} placeholder="Add your own choice"
            aria-label="Add your own choice" maxLength={30} className="min-h-[44px]" />
          <Button type="button" variant="outline" className="min-h-[44px] shrink-0"
            onClick={() => { const next = addOptionChoice(options, customChoice); onOptions(next); if (next.length !== sanitizeOptions(options).length || next.includes(customChoice.trim())) setCustomChoice(""); }}>
            + Add your own
          </Button>
        </div>
      </div>
    )}
    <div className="space-y-1.5">
      <Label htmlFor={`${uid}-description`}>Description</Label>
      <Textarea id={`${uid}-description`} value={description} onChange={(e) => onDescription(e.target.value)} placeholder="Full details: sizes, materials, specifications, or delivery" maxLength={4000} rows={5} />
    </div>
  </div>;
}
