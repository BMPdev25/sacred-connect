import { sendPasswordReset } from '@/services/auth/authService';
import { isValidEmail } from '@/services/auth/authValidation';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

/** Setter type for local React state hooks. */
type Setter<T> = (value: T) => void;

/**
 * Handles validation of the email and requests the password reset link.
 * On success, triggers the crossfade transition to the success state.
 * 
 * @param email - User entered email address.
 * @param setIsSuccess - Success state setter.
 * @param setError - Error state setter.
 * @param setLoading - Loading state setter.
 * @param startAnimation - Callback to trigger crossfade animation.
 */
export async function handleSendReset(
  email: string,
  setIsSuccess: Setter<boolean>,
  setError: Setter<string>,
  setLoading: Setter<boolean>,
  startAnimation: () => void
): Promise<void> {
  const validation = isValidEmail(email);
  if (!validation.isValid) {
    setError(validation.error || 'Please enter a valid email address');
    return;
  }

  try {
    setLoading(true);
    setError('');
    await sendPasswordReset(email.trim());
    setIsSuccess(true);
    startAnimation();
  } catch (err: any) {
    logger.error('Password reset request failed', err);
    setError(getReadableErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
