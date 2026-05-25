import { Alert } from 'react-native';
import { Router } from 'expo-router';

import { sendOtp, verifyOtp } from '@/services/auth/authService';
import { initializeAuthListener } from '@/services/auth/authStateManager';
import { logger } from '@/utils/logger';

/** Setter type for local React state hooks. */
type Setter<T> = (value: T) => void;

/**
 * Handles verifying the 6-digit OTP code against the backend API.
 * Delegates to verifyOtp and triggers shake animations on failure.
 * 
 * @param digits - The 6-digit code array.
 * @param phone - The target verification phone number.
 * @param flowContext - The current navigation context ('login' | 'signup').
 * @param router - Expo Router instance.
 * @param setError - Local error message state setter.
 * @param setLoading - Local loading flag state setter.
 * @param triggerShake - Callback function to initiate horizontal input shake.
 */
export async function handleVerify(
  digits: string[],
  phone: string,
  flowContext: 'login' | 'signup',
  router: Router,
  setError: Setter<string>,
  setLoading: Setter<boolean>,
  triggerShake: () => void
): Promise<void> {
  const otp = digits.join('');
  if (otp.length < 6) {
    setError('Please enter all 6 digits of the code.');
    triggerShake();
    return;
  }

  try {
    setLoading(true);
    setError('');
    await verifyOtp(phone, otp);
    initializeAuthListener(null, router);
  } catch (err: any) {
    logger.error('OTP verification failed', err);
    setError(err.message || 'Incorrect code. Please try again.');
    triggerShake();
  } finally {
    setLoading(false);
  }
}

/**
 * Handles resending the verification OTP to the user's phone number.
 * Triggers state resets upon successful API response.
 * 
 * @param phone - The target verification phone number.
 * @param resetTimer - Callback to reset countdown timer.
 * @param resetDigits - Callback to clear the input fields.
 * @param setError - Local error message state setter.
 * @param setLoading - Local loading flag state setter.
 */
export async function handleResend(
  phone: string,
  resetTimer: () => void,
  resetDigits: () => void,
  setError: Setter<string>,
  setLoading: Setter<boolean>
): Promise<void> {
  try {
    setLoading(true);
    setError('');
    await sendOtp(phone);
    resetTimer();
    resetDigits();
  } catch (err: any) {
    logger.error('Resending OTP failed', err);
    Alert.alert('Verification Error', err.message || 'Failed to resend verification code. Please try again.');
  } finally {
    setLoading(false);
  }
}
