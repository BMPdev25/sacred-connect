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
  try {
    const formData = new FormData();
    const filePayload = {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any;

    formData.append('profilePicture', filePayload);

    const response = await api.post('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (err: any) {
    logger.error('uploadProfilePicture service call failed', err);
    const errMsg = err?.response?.data?.message || err?.message || 'Failed to upload photo.';
    throw new Error(errMsg);
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
