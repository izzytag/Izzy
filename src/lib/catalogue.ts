export const CATALOGUE_PHOTO_LIMIT = 4;
export const CATALOGUE_IMAGE_BYTES = 2 * 1024 * 1024;

/** Longest side a processed catalogue photo is allowed to keep. */
export const CATALOGUE_MAX_DIMENSION = 1600;

export function validateCataloguePhoto(count: number) {
  if (count >= CATALOGUE_PHOTO_LIMIT) return "You can add up to 4 photos per item.";
  return null;
}

const UNREADABLE_PHOTO_ERROR = "This photo couldn't be read — try a JPG or PNG photo.";

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

/**
 * Decode a picked photo file in the browser. Phone photos are often
 * larger than the storage limit or in formats the old uploader rejected
 * outright, so decoding here lets us shrink them instead of refusing.
 * Throws the plain-language unreadable error when the browser cannot
 * decode the file at all (e.g. HEIC in a browser without HEIC support).
 */
async function decodeCatalogueImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
      } catch {
        // Fall through to the <img> decoder below.
      }
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(UNREADABLE_PHOTO_ERROR);
  }
}

/**
 * Prepare a picked photo for upload: decode it, downscale it to at most
 * CATALOGUE_MAX_DIMENSION px on the longest side, and re-encode it as
 * JPEG (stepping quality — then size — down) until it fits under the
 * CATALOGUE_IMAGE_BYTES storage limit. The result is always a JPEG blob,
 * whatever the original format or size was.
 */
export async function processCataloguePhoto(file: File): Promise<Blob> {
  const decoded = await decodeCatalogueImage(file);
  try {
    if (!decoded.width || !decoded.height) throw new Error(UNREADABLE_PHOTO_ERROR);
    let scale = Math.min(1, CATALOGUE_MAX_DIMENSION / Math.max(decoded.width, decoded.height));
    let quality = 0.85;
    for (let attempt = 0; attempt < 10; attempt++) {
      const w = Math.max(1, Math.round(decoded.width * scale));
      const h = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(UNREADABLE_PHOTO_ERROR);
      // JPEG has no transparency — flatten onto white, not black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(decoded.source, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= CATALOGUE_IMAGE_BYTES) return blob;
      if (quality > 0.45) quality = Math.max(0.4, quality - 0.15);
      else scale *= 0.75;
    }
    throw new Error("This photo is too large to use — try a smaller photo.");
  } finally {
    decoded.cleanup();
  }
}
