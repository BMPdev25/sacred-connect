/**
 * State manager tracking Firebase Authentication state changes,
 * orchestrating Redux session stores and Expo Router navigation flows.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { auth } from '@/config/firebase';
import { ONBOARDING_STORAGE_KEY } from '@/constants/config';
import { store } from '@/redux/store';
import { setUserSession } from '@/redux/slices/userSlice';
import { PriestAuthState, UserProfile } from '@/types/api.types';
import { logger } from '@/utils/logger';
import { hasPriestCompletedOnboarding } from '@/utils/priestUtils';
import { refreshToken, syncWithBackend } from './authService';

// ---------------------------------------------------------------------------
// Helpers (extracted named functions)
// ---------------------------------------------------------------------------

/**
 * Checks AsyncStorage to verify if this is the first launch of the application.
 *
 * @returns True if it is the first launch, otherwise false.
 */
export async function checkFirstLaunch(): Promise<boolean> {
  try {
    const hasLaunched = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    return hasLaunched === null;
  } catch (err) {
    logger.error('AsyncStorage read error', err);
    return false;
  }
}

/**
 * Marks the application as launched in AsyncStorage.
 */
export async function markLaunched(): Promise<void> {
  try {
    const hasLaunched = await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch (err) {
    logger.error('AsyncStorage write error', err);
  }
}

/**
 * Fetches the user profile and onboarding states from the backend.
 * Automatically attempts a single token refresh and retry on 401 errors.
 *
 * @param firebaseUser - The active Firebase User session object.
 * @returns Consolidated User Profile and optional Priest Auth Onboarding state.
 */
export async function fetchUserProfile(
  firebaseUser: FirebaseUser
): Promise<UserProfile & { priestState?: PriestAuthState }> {
  try {
    const token = await firebaseUser.getIdToken();
    return await syncWithBackend(token);
  } catch (err: any) {
    const isUnauthorized =
      err.message?.includes('401') ||
      err.message?.toLowerCase().includes('authorized') ||
      err.message?.toLowerCase().includes('expired');

    if (isUnauthorized) {
      logger.log('Session expired/unauthorized. Attempting token refresh retry...');
      try {
        const freshToken = await refreshToken();
        return await syncWithBackend(freshToken);
      } catch (retryErr) {
        logger.error('Token refresh retry failed');
        throw new Error('SESSION_EXPIRED');
      }
    }
    throw err;
  }
}

/**
 * Determines and executes the navigation path for authenticated users.
 * Always dispatches the user session to Redux via the global store.
 *
 * @param profile - The user profile structure.
 * @param priestState - Priest onboarding status, if applicable.
 * @param router - Expo Router instance.
 */
export function routeAuthenticatedUser(
  profile: UserProfile,
  priestState: PriestAuthState | undefined,
  router: any
): void {
  console.log(`[DEBUG] routeAuthenticatedUser: profile userType = ${profile.userType}`);

  // Always populate Redux with the authenticated user's data
  store.dispatch(setUserSession({ user: profile, priestState }));

  if (profile.userType === 'devotee') {
    console.log('[DEBUG] routeAuthenticatedUser: Redirecting to Devotee Dashboard (/devotee)');
    router.replace('/devotee');
  } else if (profile.userType === 'priest') {
    const completed = hasPriestCompletedOnboarding(
      priestState?.onboardingCompleted,
      priestState?.verificationStatus
    );

    if (!completed) {
      console.log('[DEBUG] routeAuthenticatedUser: Redirecting to Priest Onboarding Wizard (/priest/onboarding)');
      router.replace('/priest/onboarding');
      return;
    }

    // Onboarding is complete — route based on verificationStatus
    const isVerified = priestState?.verificationStatus === 'verified' || (priestState?.verificationStatus as string) === 'approved';
    if (isVerified) {
      console.log('[DEBUG] routeAuthenticatedUser: Redirecting to Priest Dashboard (/priest)');
      router.replace('/priest');
    } else if (priestState?.verificationStatus === 'pending') {
      console.log('[DEBUG] routeAuthenticatedUser: Redirecting to Verification Status (/priest/onboarding/verification-status)');
      router.replace('/priest/onboarding/verification-status');
    } else if (priestState?.verificationStatus === 'rejected') {
      console.log('[DEBUG] routeAuthenticatedUser: Redirecting to Verification Status (/priest/onboarding/verification-status) - Rejected');
      router.replace('/priest/onboarding/verification-status');
    } else {
      console.log('[DEBUG] routeAuthenticatedUser: Fallback - Redirecting to Priest Onboarding Wizard (/priest/onboarding)');
      router.replace('/priest/onboarding');
    }
  } else {
    logger.warn('Unknown userType encountered. Routing to auth selection', profile.userType);
    console.log('[DEBUG] routeAuthenticatedUser: Unknown userType. Redirecting to /role-selection');
    router.replace('/role-selection');
  }
}

/**
 * Determines and executes the navigation path for unauthenticated sessions.
 *
 * @param isFirstLaunch - Flag indicating whether it's the first time launch.
 * @param router - Expo Router instance.
 */
export function routeUnauthenticatedUser(isFirstLaunch: boolean, router: any): void {
  console.log(`[DEBUG] routeUnauthenticatedUser: isFirstLaunch = ${isFirstLaunch}`);
  if (isFirstLaunch) {
    console.log('[DEBUG] routeUnauthenticatedUser: Redirecting to /onboarding');
    router.replace('/onboarding');
  } else {
    console.log('[DEBUG] routeUnauthenticatedUser: Redirecting to /login');
    router.replace('/login');
  }
}

/**
 * Handles errors occurring during authentication listener updates.
 *
 * @param error - The encountered error object.
 * @param router - Expo Router instance.
 */
export function handleAuthError(error: any, router: any): void {
  console.log('[DEBUG] handleAuthError: Auth listener failed, redirecting to /login. Error:', error);
  logger.error('Authentication listener error occurred', error);
  router.replace('/login');
}

/** Reference to the active Firebase Auth unsubscribe handler to prevent multiple observers. */
let activeUnsubscribe: (() => void) | null = null;

/**
 * Processes Firebase Auth state changes and routes the user accordingly.
 *
 * @param firebaseUser - The active Firebase User session object or null.
 * @param router - Expo Router instance.
 */
async function handleAuthStateChange(
  firebaseUser: FirebaseUser | null,
  router: any
): Promise<void> {
  try {
    console.log('[DEBUG] onAuthStateChanged: Fired. User active:', Boolean(firebaseUser));
    if (firebaseUser) {
      console.log(`[DEBUG] onAuthStateChanged: User UID = ${firebaseUser.uid}, email = ${firebaseUser.email}`);
      const profileWithState = await fetchUserProfile(firebaseUser);
      routeAuthenticatedUser(
        profileWithState,
        profileWithState.priestState,
        router
      );
    } else {
      console.log('[DEBUG] onAuthStateChanged: No user session found. Checking first launch...');
      const firstLaunch = await checkFirstLaunch();
      routeUnauthenticatedUser(firstLaunch, router);
    }
  } catch (err: any) {
    console.log('[DEBUG] onAuthStateChanged: Error inside listener wrapper:', err);
    if (
      err.status === 400 ||
      err.status === 404 ||
      err.message?.includes('400') ||
      err.message?.includes('404')
    ) {
      console.log('[DEBUG] onAuthStateChanged: Backend has no record for this Firebase user. Redirecting to role selection.');
      router.replace('/role-selection');
      return;
    }
    handleAuthError(err, router);
  }
}

/**
 * Initializes the Firebase Auth observer, populating Redux and routing the
 * application based on the user's credentials and launch history.
 *
 * Must only be called ONCE (from splash.tsx). All login flows rely on the
 * existing subscription firing when Firebase auth state changes.
 *
 * @param router - Expo Router instance.
 * @returns The unsubscribe function for the auth listener.
 */
export function initializeAuthListener(router: any): () => void {
  if (activeUnsubscribe) {
    console.log('[DEBUG] initializeAuthListener: Unsubscribing previous listener before re-initialization.');
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  console.log('[DEBUG] initializeAuthListener: Subscribing to Firebase Auth changes...');

  const unsubscribe = onAuthStateChanged(
    auth,
    (user) => {
      handleAuthStateChange(user, router);
    },
    (error) => {
      console.log('[DEBUG] onAuthStateChanged: Firebase observer error event:', error);
      handleAuthError(error, router);
    }
  );

  activeUnsubscribe = unsubscribe;
  return unsubscribe;
}
