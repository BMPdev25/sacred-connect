import Constants from 'expo-constants';

/**
 * Defines the local image registry structure, mapping image keys to React Native asset sources.
 */
export type LocalImageRegistry = Record<string, ReturnType<typeof require>>;

/**
 * Registry containing require references for local development assets.
 */
const IMAGE_REGISTRY: LocalImageRegistry = {
  'auth.splash': require('@/assets/images/auth/splash-bg.png'),
  'auth.onboarding1': require('@/assets/images/auth/onboarding-slide-1.png'),
  'auth.onboarding2': require('@/assets/images/auth/onboarding-slide-2.png'),
  'auth.onboarding3': require('@/assets/images/auth/onboarding-slide-3.png'),
  'auth.forgotSuccess': require('@/assets/images/auth/forgot-password-success.png'),
  'shared.logoIcon': require('@/assets/images/shared/logo-icon.png'),
  'shared.logoFull': require('@/assets/images/shared/logo-full.png'),
  'shared.avatarPlaceholder': require('@/assets/images/shared/avatar-placeholder.png'),
};

/**
 * Registry mapping keys to remote S3 file paths/names.
 */
const IMAGE_FILENAMES: Record<string, string> = {
  'auth.splash': 'auth/splash-bg.png',
  'auth.onboarding1': 'auth/onboarding-slide-1.png',
  'auth.onboarding2': 'auth/onboarding-slide-2.png',
  'auth.onboarding3': 'auth/onboarding-slide-3.png',
  'auth.forgotSuccess': 'auth/forgot-password-success.png',
  'shared.logoIcon': 'shared/logo-icon.png',
  'shared.logoFull': 'shared/logo-full.png',
  'shared.avatarPlaceholder': 'shared/avatar-placeholder.png',
};

/**
 * Registry mapping document keys to remote S3 file paths.
 */
const DOCUMENT_FILENAMES: Record<string, string> = {
  'policy.terms': 'documents/terms.pdf',
  'policy.privacy': 'documents/privacy.pdf',
};

/**
 * Retrieves the image source. If ASSET_BASE_URL is configured, returns
 * a remote URI object. Otherwise, resolves to the bundled local resource.
 * Falls back to avatar placeholder if the requested key is not found.
 * 
 * @param key - The registry key of the desired image.
 * @returns React Native image source (local require number or URI object).
 */
export function getImage(key: string): ReturnType<typeof require> | { uri: string } {
  const assetBaseUrl = 
    process.env.EXPO_PUBLIC_ASSET_BASE_URL || 
    process.env.ASSET_BASE_URL || 
    (Constants.expoConfig?.extra?.ASSET_BASE_URL as string | undefined);

  if (!(key in IMAGE_REGISTRY)) {
    console.warn(`AssetService: Image key "${key}" not found in registry. Falling back to avatar placeholder.`);
    const fallbackKey = 'shared.avatarPlaceholder';
    if (assetBaseUrl) {
      const filename = IMAGE_FILENAMES[fallbackKey];
      return { uri: `${assetBaseUrl}/${filename}` };
    }
    return IMAGE_REGISTRY[fallbackKey];
  }

  if (assetBaseUrl) {
    const filename = IMAGE_FILENAMES[key];
    return { uri: `${assetBaseUrl}/${filename}` };
  }

  return IMAGE_REGISTRY[key];
}

/**
 * Retrieves the document URL. Documents are hosted remotely on the asset server
 * and are never bundled locally.
 * 
 * @param key - The registry key of the desired document.
 * @returns The remote URL string for the document, or empty string if asset server URL is unset.
 */
export function getDocument(key: string): string {
  const assetBaseUrl = 
    process.env.EXPO_PUBLIC_ASSET_BASE_URL || 
    process.env.ASSET_BASE_URL || 
    (Constants.expoConfig?.extra?.ASSET_BASE_URL as string | undefined);

  if (!assetBaseUrl) {
    console.warn(`AssetService: ASSET_BASE_URL not configured. Cannot load document "${key}".`);
    return '';
  }

  const filename = DOCUMENT_FILENAMES[key] || key;
  if (!(key in DOCUMENT_FILENAMES)) {
    console.warn(`AssetService: Document key "${key}" not found in document filenames mapping. Using fallback.`);
  }

  return `${assetBaseUrl}/${filename}`;
}

/**
 * Service for retrieving application assets (images, documents).
 * Abstracts local/bundled resource loading from remote/S3 bucket loading.
 */
export const AssetService = {
  getImage,
  getDocument,
};
