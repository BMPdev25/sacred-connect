/**
 * State manager tracking Firebase Authentication state changes,
 * orchestrating Redux session stores and Expo Router navigation flows.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { auth } from '@/config/firebase';
import { ONBOARDING_STORAGE_KEY } from '@/constants/config';
import { PriestAuthState, UserProfile } from '@/types/api.types';
import { logger } from '@/utils/logger';
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
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
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
 * 
 * @param profile - The user profile structure.
 * @param priestState - Priest onboarding status, if applicable.
 * @param dispatch - Redux action dispatcher.
 * @param router - Expo Router instance.
 */
export function routeAuthenticatedUser(
  profile: UserProfile,
  priestState: PriestAuthState | undefined,
  dispatch: any,
  router: any
): void {
  if (dispatch) {
    dispatch({
      type: 'auth/setUserSession',
      payload: { user: profile, priestState },
    });
  }

  if (profile.userType === 'devotee') {
    router.replace('/devotee');
  } else if (profile.userType === 'priest') {
    if (priestState?.onboardingCompleted) {
      router.replace('/priest');
    } else {
      router.replace('/priest/onboarding');
    }
  } else {
    logger.warn('Unknown userType encountered. Routing to auth selection', profile.userType);
    router.replace('/(auth)/role-selection');
  }
}

/**
 * Determines and executes the navigation path for unauthenticated sessions.
 * 
 * @param isFirstLaunch - Flag indicating whether it's the first time launch.
 * @param router - Expo Router instance.
 */
export function routeUnauthenticatedUser(isFirstLaunch: boolean, router: any): void {
  if (isFirstLaunch) {
    router.replace('/(auth)/onboarding');
  } else {
    router.replace('/(auth)/login');
  }
}

/**
 * Handles errors occurring during authentication listener updates.
 * 
 * @param error - The encountered error object.
 * @param router - Expo Router instance.
 */
export function handleAuthError(error: any, router: any): void {
  logger.error('Authentication listener error occurred', error);
  router.replace('/(auth)/login');
}

/**
 * Initializes the Firebase Auth observer, updating Redux session states
 * and routing the application depending on credentials and launch history.
 * 
 * @param dispatch - Redux action dispatcher.
 * @param router - Expo Router instance.
 * @returns The unsubscribe function for the auth listener.
 */
export function initializeAuthListener(dispatch: any, router: any): () => void {
  return onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profileWithState = await fetchUserProfile(firebaseUser);
          routeAuthenticatedUser(
            profileWithState,
            profileWithState.priestState,
            dispatch,
            router
          );
        } else {
          const firstLaunch = await checkFirstLaunch();
          routeUnauthenticatedUser(firstLaunch, router);
        }
      } catch (err: any) {
        handleAuthError(err, router);
      }
    },
    (error) => {
      handleAuthError(error, router);
    }
  );
}
