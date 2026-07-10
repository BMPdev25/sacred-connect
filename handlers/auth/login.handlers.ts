import { Router } from 'expo-router';

import { loginWithEmail, loginWithGoogle, sendOtp } from '@/services/auth/authService';
import { isValidPhone } from '@/services/auth/authValidation';
import { setPendingGoogleProfile, setSignupInProgress } from '@/services/auth/signupState';
import { logger } from '@/utils/logger';

/** Setter type used by error state setters. */
type Setter<T> = (value: T) => void;

/**
 * Handles email + password login.
 * Validates inputs, delegates to authService, then lets the auth listener route.
 *
 * @param email - User-supplied email string.
 * @param password - User-supplied password string.
 * @param setError - State setter for the screen-level error message.
 * @param setLoading - State setter for the loading flag.
 * @param router - Expo Router instance.
 */
export async function handleEmailLogin(
  email: string,
  password: string,
  setError: Setter<string>,
  setLoading: Setter<boolean>,
  router: Router,
): Promise<void> {
  if (!email.trim() || !password.trim()) {
    setError('Please enter your email and password.');
    return;
  }
  try {
    setLoading(true);
    setError('');
    await loginWithEmail(email, password);
    // Firebase onAuthStateChanged on the splash listener handles routing automatically
  } catch (err: any) {
    logger.error('handleEmailLogin failed', err);
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
}

/**
 * Handles phone OTP dispatch.
 * Validates phone, calls authService.sendOtp, then navigates to OTP screen.
 *
 * @param phone - User-supplied phone number string.
 * @param setError - State setter for the screen-level error message.
 * @param setLoading - State setter for the loading flag.
 * @param router - Expo Router instance.
 */
export async function handleSendOtp(
  phone: string,
  setError: Setter<string>,
  setLoading: Setter<boolean>,
  router: Router,
): Promise<void> {
  const validation = isValidPhone(phone);
  if (!validation.isValid) {
    setError(validation.error ?? 'Invalid phone number.');
    return;
  }
  try {
    setLoading(true);
    setError('');
    await sendOtp(phone);
    router.push({ pathname: '/otp-verify', params: { phone } });
  } catch (err: any) {
    logger.error('handleSendOtp failed', err);
    setError(err.message || 'Failed to send OTP. Please try again.');
  } finally {
    setLoading(false);
  }
}

/**
 * Handles Google OAuth login.
 * On new users, routes to role selection. On existing users, lets the
 * auth listener handle routing.
 *
 * @param setError - State setter for the screen-level error message.
 * @param setLoading - State setter for the loading flag.
 * @param router - Expo Router instance.
 */
export async function handleGoogleLogin(
  setError: Setter<string>,
  setLoading: Setter<boolean>,
  router: Router,
): Promise<void> {
  try {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (result.isNewUser) {
      // Keep the auth listener paused across the role-selection ->
      // signup-priest navigation so a NO_ACCOUNT 404 mid-flow doesn't yank
      // the user back to role-selection while they're completing signup.
      setSignupInProgress(true);
      setPendingGoogleProfile({ email: result.email || '', name: result.name });
      router.replace('/(auth)/role-selection');
    } else {
      // existing user — auth listener handles routing
    }
  } catch (err: any) {
    logger.error('handleGoogleLogin failed', err);
    setError(err.message || 'Google login failed. Please try again.');
  } finally {
    setLoading(false);
  }
}
