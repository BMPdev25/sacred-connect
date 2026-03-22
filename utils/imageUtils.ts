/**
 * Safely extracts a URI string from various image data structures.
 * The backend may return a string or an object with a 'url' property.
 * 
 * @param imageField The image field from the backend (could be string, object, or null)
 * @param fallback The fallback URL to return if imageField is invalid
 * @returns A URI string or the fallback
 */
export function getImageUri(imageField: any, fallback: string = "https://via.placeholder.com/150"): string {
  if (!imageField) return fallback;

  // Case 1: Already a string (standard URL)
  if (typeof imageField === "string") {
    // Basic check for empty string or just whitespace
    return imageField.trim() || fallback;
  }

  // Case 2: Object with 'url' property (Cloudinary structure or Ceremony images)
  if (typeof imageField === "object") {
    if (imageField.url && typeof imageField.url === "string") {
      return imageField.url;
    }
  }

  return fallback;
}
