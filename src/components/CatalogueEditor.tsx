import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATALOGUE_PHOTO_LIMIT, processCataloguePhoto, validateCataloguePhoto } from "@/lib/catalogue";

export function CatalogueEditor({ userId, images, onImages, category, onCategory, description, onDescription }: {
  userId: string; images: string[]; onImages: (v: string[]) => void;
  category: string; onCategory: (v: string) => void;
  description: string; onDescription: (v: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [uploading, setUploading] = useState(false);

  // Picked photos are processed in the browser first (downscaled and
  // re-encoded as JPEG), so ordinary phone photos — big files included —
  // upload fine instead of being rejected for size or format.
  async function uploadFiles(files: FileList) {
    const picked = Array.from(files);
    if (!picked.length) return;
    const limitError = validateCataloguePhoto(images.length);
    if (limitError) return void toast.error(limitError);
    setUploading(true);
    let next = [...images];
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
      }
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2">
      {images.map((src, i) => <div key={src} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <img src={src} alt={`Item photo ${i + 1}`} className="h-full w-full object-cover" />
        <Button type="button" size="icon" variant="secondary" className="absolute right-1 top-1 h-8 w-8" aria-label={`Remove photo ${i + 1}`} onClick={() => onImages(images.filter((_, index) => index !== i))}><X /></Button>
      </div>)}
      {images.length < CATALOGUE_PHOTO_LIMIT && <Button type="button" variant="outline" disabled={uploading} className="h-auto min-h-16 aspect-square flex-col gap-1 px-1 text-xs" onClick={() => input.current?.click()}>
        {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />} {uploading ? "Uploading" : "Add photo"}
      </Button>}
    </div>
    <input ref={input} hidden type="file" accept="image/*" multiple aria-label="Upload item photos" onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); }} />
    <div className="space-y-1.5">
      <Label htmlFor={`${uid}-category`}>Category</Label>
      <Input id={`${uid}-category`} value={category} onChange={(e) => onCategory(e.target.value)} placeholder="Category, e.g. Clothing or Consultation" maxLength={60} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor={`${uid}-description`}>Description</Label>
      <Textarea id={`${uid}-description`} value={description} onChange={(e) => onDescription(e.target.value)} placeholder="Full details: sizes, materials, specifications, delivery, or what your service includes" maxLength={4000} rows={5} />
    </div>
  </div>;
}
