/**
 * Signup screen action handlers — async operations extracted from components
 * per AGENTS.md rule 7 (API calls never live inside components).
 */

import { Router } from 'expo-router';

import { registerUser } from '@/services/auth/authService';
import { SignupDevoteePayload, SignupPriestPayload } from '@/types/auth.types';
import { logger } from '@/utils/logger';

/** Shared setter type alias. */
type Setter<T> = (v: T) => void;

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

/**
 * Calls authService.registerUser and handles success/error routing.
 * Shared by both devotee and priest handlers.
 */
async function executeRegistration(
  payload: SignupDevoteePayload | SignupPriestPayload,
  successRoute: string,
  setLoading: Setter<boolean>,
  setGeneralError: Setter<string | null>,
  router: Router,
): Promise<void> {
  try {
    setLoading(true);
    setGeneralError(null);
    await registerUser(payload);
    router.replace(successRoute as any);
  } catch (err: any) {
    logger.error('Registration error', err);
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
): Promise<void> {
  await executeRegistration(
    payload,
    '/(devotee)/(tabs)/HomeTab',
    setLoading,
    setGeneralError,
    router,
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
): Promise<void> {
  await executeRegistration(
    payload,
    '/(priest)/onboarding/wizard',
    setLoading,
    setGeneralError,
    router,
  );
}
