import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATALOGUE_PHOTO_LIMIT, validateCataloguePhoto } from "@/lib/catalogue";

export function CatalogueEditor({ userId, images, onImages, category, onCategory, description, onDescription }: {
  userId: string; images: string[]; onImages: (v: string[]) => void;
  category: string; onCategory: (v: string) => void;
  description: string; onDescription: (v: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    const error = validateCataloguePhoto(file, images.length);
    if (error) return void toast.error(error);
    setUploading(true);
    const path = `${userId}/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]}`;
    try {
      const bucket = supabase.storage.from("catalogue");
      const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data, error: signError } = await bucket.createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signError || !data) throw signError || new Error("Couldn't prepare the photo.");
      onImages([...images, data.signedUrl]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload the photo. Please try again.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2">
      {images.map((src, i) => <div key={src} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <img src={src} alt={`Item photo ${i + 1}`} className="h-full w-full object-cover" />
        <Button type="button" size="icon" variant="secondary" className="absolute right-1 top-1 h-6 w-6" aria-label={`Remove photo ${i + 1}`} onClick={() => onImages(images.filter((_, index) => index !== i))}><X /></Button>
      </div>)}
      {images.length < CATALOGUE_PHOTO_LIMIT && <Button type="button" variant="outline" disabled={uploading} className="h-auto min-h-16 aspect-square flex-col gap-1 px-1 text-xs" onClick={() => input.current?.click()}>
        {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />} {uploading ? "Uploading" : "Add photo"}
      </Button>}
    </div>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload item photo" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
    <Input value={category} onChange={(e) => onCategory(e.target.value)} placeholder="Category, e.g. Clothing or Consultation" aria-label="Item category" maxLength={60} />
    <Textarea value={description} onChange={(e) => onDescription(e.target.value)} placeholder="Full details: sizes, materials, specifications, delivery, or what your service includes" aria-label="Item details" maxLength={4000} rows={5} />
  </div>;
}