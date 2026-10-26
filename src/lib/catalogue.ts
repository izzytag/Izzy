export const CATALOGUE_PHOTO_LIMIT = 4;
export const CATALOGUE_IMAGE_BYTES = 2 * 1024 * 1024;

export function validateCataloguePhoto(file: { type: string; size: number }, count: number) {
  if (count >= CATALOGUE_PHOTO_LIMIT) return "You can add up to 4 photos per item.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choose a JPG, PNG or WebP photo.";
  if (file.size > CATALOGUE_IMAGE_BYTES) return "Each photo must be 2MB or smaller.";
  return null;
}