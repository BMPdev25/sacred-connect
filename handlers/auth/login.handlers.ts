/**
 * Login screen action handlers — all async auth operations extracted from
 * the component to satisfy the "API calls never live inside components" rule.
 */

import { Router } from 'expo-router';

import { loginWithEmail, loginWithGoogle, sendOtp } from '@/services/auth/authService';
import { initializeAuthListener } from '@/services/auth/authStateManager';
import { isValidPhone } from '@/services/auth/authValidation';
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
    // onAuthStateChanged in initializeAuthListener handles routing
    initializeAuthListener(null, router);
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
    const { isNewUser } = await loginWithGoogle();
    if (isNewUser) {
      router.replace('/role-selection');
    } else {
      initializeAuthListener(null, router);
    }
  } catch (err: any) {
    logger.error('handleGoogleLogin failed', err);
    setError(err.message || 'Google login failed. Please try again.');
  } finally {
    setLoading(false);
  }
}
