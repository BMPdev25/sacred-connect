import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import api from '@/api/index';
import { UserProfile } from '@/types/api.types';
import { NotificationPreferences, ProfileUpdatePayload } from '@/types/profile.types';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

/**
 * Fetch the current authenticated user's full profile details.
 *
 * @returns A promise resolving to the user's UserProfile data.
 * @throws An error if fetching fails.
 */
export async function fetchProfile(): Promise<UserProfile> {
  try {
    const response = await api.get('/users/profile');
    return response.data.data;
  } catch (err: unknown) {
    logger.error('fetchProfile service call failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Update the current authenticated user's name and/or phone number.
 *
 * @param payload - Object containing name and/or phone fields to update.
 * @returns A promise resolving to the updated UserProfile.
 * @throws An error on failure with "Failed to update profile." message.
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  try {
    const response = await api.put('/users/profile', payload);
    return response.data.data;
  } catch (err: unknown) {
    logger.error('updateProfile service call failed', err);
    throw new Error('Failed to update profile.');
  }
}

/**
 * Upload a new user profile picture using multipart/form-data.
 *
 * @param imageUri - Local path or URI of the selected image.
 * @param fileName - File name to use for the upload.
 * @param mimeType - MIME type of the image.
 * @returns A promise resolving to the uploaded profile picture URL.
 * @throws An error on failure with "Failed to upload photo." message.
 */
export async function uploadProfilePicture(
  imageUri: string,
  fileName: string,
  mimeType: string
): Promise<{ profilePicture: { url: string; uploadedAt: string } | string }> {
  // Axios/XHR's FormData implementation cannot read file:// URIs on Android —
  // the multipart body is silently dropped, producing ERR_NETWORK before the
  // request leaves the device. FileSystem.uploadAsync uses Expo's native HTTP
  // layer which handles file:// URIs correctly on both platforms.
  let fileUri = imageUri;
  let cleanup: (() => Promise<void>) | undefined;

  // content:// URIs (Android media store) must be copied to a file:// path
  // before expo-file-system can upload them.
  if (Platform.OS === 'android' && imageUri.startsWith('content://')) {
    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
    const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: imageUri, to: dest });
    fileUri = dest;
    cleanup = () => FileSystem.deleteAsync(dest, { idempotent: true });
  }

  try {
    const { auth } = await import('@/config/firebase');
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    const baseURL = process.env.EXPO_PUBLIC_API_URL ?? '';
    const uploadUrl = `${baseURL}/users/profile/picture`;

    const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'profilePicture',
      mimeType: mimeType || 'image/jpeg',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (result.status < 200 || result.status >= 300) {
      let serverMsg: string | undefined;
      try {
        serverMsg = JSON.parse(result.body)?.message;
      } catch {}
      throw new Error(serverMsg || `Upload failed with status ${result.status}`);
    }

    const parsed = JSON.parse(result.body);
    return parsed.data;
  } catch (err: any) {
    logger.error('uploadProfilePicture failed', {
      message: err?.message,
      status: err?.status,
    });
    throw new Error(err?.message || 'Failed to upload photo.');
  } finally {
    await cleanup?.();
  }
}

/**
 * Update notification preference configurations. Failures are handled silently.
 *
 * @param prefs - Partial set of notification preferences to merge.
 * @returns A promise resolving when preferences are updated.
 */
export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const emailUpdates = {
      bookingUpdates: prefs.bookingConfirmations,
      reminders: prefs.upcomingReminders,
      promotions: prefs.festivalOffers ?? prefs.newFeatures,
    };

    const pushUpdates = {
      bookingUpdates: prefs.bookingConfirmations,
      reminders: prefs.upcomingReminders,
      promotions: prefs.festivalOffers ?? prefs.newFeatures,
    };

    const body = {
      ...prefs,
      email: emailUpdates,
      push: pushUpdates,
    };

    await api.put('/users/notifications', body);
  } catch (err: unknown) {
    // Log only — never break UI for notification preference updates
    logger.warn('Silent failure updating notification preferences', err);
  }
}
