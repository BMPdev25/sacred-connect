import { AssetService } from '@/services/assets/AssetService';

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
 * Image source object. Falls back to avatar-placeholder when the field is empty or invalid.
 *
 * @param pic - Raw profilePicture value from Redux or API.
 * @param placeholder - Optional fallback source; defaults to shared.avatarPlaceholder.
 * @returns An Image source object safe to pass directly to <Image source={...} />.
 */
export function getProfilePicSource(
  pic: any,
  placeholder: any = AssetService.getImage('shared.avatarPlaceholder')
): { uri: string } | any {
  const url = normalizeProfilePicture(pic);
  return url ? { uri: url } : placeholder;
}

/**
 * Resolves a ceremony images array to a React Native Image source.
 * Picks the first image with a valid `url` string, or falls back to a
 * generic ceremony placeholder.
 *
 * @param images - Array of ceremony image objects from the API, or null/undefined.
 * @returns An Image source safe to pass to <Image source={...} />.
 */
export function getCeremonyImageSource(
  images: Array<{ url?: string; isPrimary?: boolean }> | undefined | null
): { uri: string } | any {
  const primary =
    images?.find((img) => img?.isPrimary && img.url) ??
    images?.find((img) => img?.url);
  if (primary?.url && primary.url.length > 0) {
    return { uri: primary.url };
  }
  return AssetService.getImage('shared.ceremonyPlaceholder');
}

/**
 * Safely extracts a URI string from various image data structures.
 * The backend may return a string or an object with a 'url' property.
 *
 * @param imageField The image field from the backend (could be string, object, or null)
 * @param fallback The fallback URL to return if imageField is invalid
 * @returns A URI string or the fallback
 */
export function getImageUri(
  imageField: any,
  fallback: string = 'https://via.placeholder.com/150'
): string {
  if (!imageField) return fallback;
  if (typeof imageField === 'string') return imageField.trim() || fallback;
  if (typeof imageField === 'object' && imageField.url && typeof imageField.url === 'string') {
    return imageField.url;
  }
  return fallback;
}
