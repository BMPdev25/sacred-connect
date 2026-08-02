import { Router } from 'expo-router';

import { registerUser } from '@/services/auth/authService';
import { store } from '@/redux/store';
import { setUserSession } from '@/redux/slices/userSlice';
import { SignupDevoteePayload, SignupPriestPayload } from '@/types/auth.types';
import { logger } from '@/utils/logger';

/** Shared setter type alias. */
type Setter<T> = (v: T) => void;

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

/**
 * Calls authService.registerUser, populates Redux user session, and routes.
 * Shared by both devotee and priest handlers.
 */
async function executeRegistration(
  payload: SignupDevoteePayload | SignupPriestPayload,
  successRoute: string,
  setLoading: Setter<boolean>,
  setGeneralError: Setter<string | null>,
  router: Router,
  setRoleConflict?: Setter<boolean>,
): Promise<void> {
  try {
    setLoading(true);
    setGeneralError(null);
    setRoleConflict?.(false);
    const profile = await registerUser(payload);
    // Populate Redux so ProfileCard and other screens can read name/email/phone
    store.dispatch(setUserSession({ user: profile }));
    router.replace(successRoute as any);
  } catch (err: any) {
    logger.error('Registration error', err);
    if (err.code === 'ROLE_CONFLICT') {
      setRoleConflict?.(true);
    }
    setGeneralError(err.message || 'Sign up failed. Please try again.');
  } finally {
    setLoading(false);
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Handles Devotee signup registration.
 * Validates the form, calls authService.registerUser, then routes to devotee tabs.
 *
 * @param payload - Validated devotee signup payload.
 * @param setLoading - Loading flag setter.
 * @param setGeneralError - General error message setter.
 * @param router - Expo Router instance.
 */
export async function handleDevoteeSignup(
  payload: SignupDevoteePayload,
  setLoading: Setter<boolean>,
  setGeneralError: Setter<string | null>,
  router: Router,
  setRoleConflict?: Setter<boolean>,
): Promise<void> {
  await executeRegistration(
    payload,
    '/devotee',
    setLoading,
    setGeneralError,
    router,
    setRoleConflict,
  );
}

/**
 * Handles Priest signup registration.
 * Validates the form, calls authService.registerUser, then routes to priest onboarding.
 *
 * @param payload - Validated priest signup payload.
 * @param setLoading - Loading flag setter.
 * @param setGeneralError - General error message setter.
 * @param router - Expo Router instance.
 */
export async function handlePriestSignup(
  payload: SignupPriestPayload,
  setLoading: Setter<boolean>,
  setGeneralError: Setter<string | null>,
  router: Router,
  setRoleConflict?: Setter<boolean>,
): Promise<void> {
  await executeRegistration(
    payload,
    '/priest/onboarding',
    setLoading,
    setGeneralError,
    router,
    setRoleConflict,
  );
}
