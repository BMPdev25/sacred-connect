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

/** Helper to construct PriestAuthState from backend completion data. */
function mapToPriestState(data: any): PriestAuthState | undefined {
  if (data.userType !== 'priest') return undefined;
  return {
    verificationStatus: data.profileCompleted ? 'verified' : 'pending',
    onboardingCompleted: data.profileCompleted || false,
    onboardingCurrentStep: data.profileCompleted ? 6 : 1,
  };
}

/**
 * Synchronizes the Firebase user session with the backend database.
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
    const priestState = mapToPriestState(response.data);
    return { ...userProfile, priestState };
  } catch (err: any) {
    logger.error('Backend sync failed', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to sync with backend');
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
    throw new Error(err.message || 'Registration failed');
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
    throw new Error(err.message || 'Email authentication failed');
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
    throw new Error(err.response?.data?.message || 'Failed to send verification code');
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
    throw new Error(err.response?.data?.message || 'Failed to verify verification code');
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
    throw new Error(err.message || 'Failed to dispatch password reset email');
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
    throw new Error(err.message || 'Google authentication failed');
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
    throw new Error(err.message || 'Failed to sign out current session');
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
    throw new Error(err.message || 'Failed to refresh authentication token');
  }
}
