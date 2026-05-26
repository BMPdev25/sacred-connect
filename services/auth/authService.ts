/**
 * Service handling Firebase Authentication and backend synchronization.
 * Follows strict modular structure, error-handling, and logging rules.
 */

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import api from '@/api';
import { auth } from '@/config/firebase';
import { PriestAuthState, UserProfile } from '@/types/api.types';
import { AuthSyncPayload, SignupDevoteePayload, SignupPriestPayload } from '@/types/auth.types';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

/** Helper to construct a typed UserProfile from backend response data. */
function mapToUserProfile(data: any): UserProfile {
  return {
    _id: data._id,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    userType: data.userType,
    firebaseUid: data.firebaseUid,
    profilePicture: data.profilePicture,
    expoPushToken: data.expoPushToken,
    authProvider: data.authProvider || 'firebase',
    isEmailVerified: auth.currentUser?.emailVerified || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/** Builds PriestAuthState from a priest profile API response (GET /priest/profile). */
function mapToPriestStateFromProfile(profileData: any): PriestAuthState {
  const rawStatus = profileData.verificationStatus || 'incomplete';
  // Map backend 'incomplete' to frontend 'pending' (not in VerificationStatus union)
  const verificationStatus: PriestAuthState['verificationStatus'] =
    rawStatus === 'approved' ? 'verified'
    : rawStatus === 'rejected' ? 'rejected'
    : 'pending';
  return {
    verificationStatus,
    onboardingCompleted: profileData.onboardingCompleted === true,
    onboardingCurrentStep: profileData.onboardingCurrentStep || 1,
  };
}

/**
 * Synchronizes the Firebase user session with the backend database.
 * For priest users, additionally fetches the priest profile to read the
 * real onboardingCompleted flag — the /auth/sync endpoint only returns
 * profileCompleted (based on isVerified) which is not the same field.
 */
export async function syncWithBackend(
  firebaseToken: string,
  payload?: Partial<AuthSyncPayload>
): Promise<UserProfile & { priestState?: PriestAuthState }> {
  try {
    const response = await api.post('/auth/sync', payload, {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    const userProfile = mapToUserProfile(response.data);

    if (userProfile.userType !== 'priest') {
      return { ...userProfile };
    }

    // Priests: fetch the actual priest profile to get onboardingCompleted
    try {
      const priestResponse = await api.get('/priest/profile', {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      });
      const priestState = mapToPriestStateFromProfile(priestResponse.data);
      return { ...userProfile, priestState };
    } catch (priestErr: any) {
      // If priest profile fetch fails, treat as incomplete onboarding
      logger.warn('Failed to fetch priest profile during sync, defaulting to onboarding', priestErr?.message);
      return {
        ...userProfile,
        priestState: { verificationStatus: 'pending', onboardingCompleted: false, onboardingCurrentStep: 1 },
      };
    }
  } catch (err: any) {
    logger.error('Backend sync failed', err.response?.data || err.message);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Creates a Firebase auth user and registers their profile with the backend.
 */
export async function registerUser(payload: SignupDevoteePayload | SignupPriestPayload): Promise<UserProfile> {
  try {
    if (!payload.password) throw new Error('Password is required for registration');
    
    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    const firebaseToken = await credential.user.getIdToken();
    
    const profile = await syncWithBackend(firebaseToken, {
      userType: payload.role,
      name: payload.name,
      phone: payload.phone,
    });
    return profile;
  } catch (err: any) {
    logger.error('Registration failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Authenticates user using standard email and password credentials.
 */
export async function loginWithEmail(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err: any) {
    logger.error('Email sign-in failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Dispatches a verification OTP request to a mobile phone number.
 */
export async function sendOtp(phone: string): Promise<void> {
  try {
    await api.post('/auth/send-otp', { phone });
  } catch (err: any) {
    logger.error('Sending OTP failed', err.response?.data || err.message);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Validates a mobile OTP and signs in to Firebase via custom token.
 */
export async function verifyOtp(phone: string, otp: string): Promise<void> {
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    const { customToken } = response.data;
    await signInWithCustomToken(auth, customToken);
  } catch (err: any) {
    logger.error('OTP verification failed', err.response?.data || err.message);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Dispatches a password reset email via Firebase.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    logger.error('Password reset email dispatch failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Initiates Google OAuth authentication flow.
 */
export async function loginWithGoogle(): Promise<{ isNewUser: boolean }> {
  try {
    throw new Error('Google OAuth is not configured on this device');
  } catch (err: any) {
    logger.error('Google authentication failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Signs out the current user session from Firebase and local state.
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    logger.error('Logout failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}

/**
 * Obtains a fresh Firebase ID Token.
 */
export async function refreshToken(): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user session found');
    return await user.getIdToken(true);
  } catch (err: any) {
    logger.error('Token refresh failed', err);
    throw new Error(getReadableErrorMessage(err));
  }
}
