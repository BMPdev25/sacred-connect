/**
 * Safely extracts a URI string from various image data structures.
 * The backend may return a string or an object with a 'url' property.
 * 
 * @param imageField The image field from the backend (could be string, object, or null)
 * @param fallback The fallback URL to return if imageField is invalid
 * @returns A URI string or the fallback
 */
/**
 * Normalizes a profilePicture field that may be a string URL or an object with a `url` property.
 * Returns a plain string URL or undefined.
 */
export function normalizeProfilePicture(pic: any): string | undefined {
  if (!pic) return undefined;
  if (typeof pic === 'string') return pic.trim() || undefined;
  if (typeof pic === 'object' && typeof pic.url === 'string') return pic.url.trim() || undefined;
  return undefined;
}

/**
 * Resolves a profilePicture field (string, object with url, or null) to a React Native
 * Image source object. Returns an AssetService placeholder when the field is empty.
 *
 * @param pic - Raw profilePicture value from Redux or API.
 * @param placeholder - Fallback Image source (e.g. from AssetService.getImage).
 * @returns An Image source object safe to pass directly to <Image source={...} />.
 */
export function getProfilePicSource(
  pic: any,
  placeholder: any
): { uri: string } | any {
  const url = normalizeProfilePicture(pic);
  return url ? { uri: url } : placeholder;
}

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
