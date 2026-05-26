/**
 * Centralized error handler utility for Sacred Connect.
 * Translates Firebase, Axios, and standard JavaScript errors into
 * clean, localized, user-friendly messages.
 */

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 *
 * @param code - Firebase Auth error code string.
 * @returns Human-readable error message.
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/wrong-password': 'Incorrect email or password. Please try again.',
    'auth/user-not-found': 'Incorrect email or password. Please try again.',
    'auth/email-already-in-use': 'This email address is already in use. Please use a different email or log in.',
    'auth/weak-password': 'Password is too weak. It must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This user account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/popup-closed-by-user': 'Sign-in window closed. Please try again.',
  };
  return messages[code] || 'Authentication failed. Please try again.';
}

/**
 * Resolves user friendly messages from Axios/HTTP errors.
 *
 * @param errorObj - The Axios error object as record.
 * @returns Human-readable Axios error message.
 */
function getAxiosErrorMessage(errorObj: Record<string, any>): string {
  if (!errorObj.response) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  const status = errorObj.response.status;
  const data = errorObj.response.data;
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') {
      return data.error;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  }
  if (status === 404) {
    return 'The requested resource could not be found.';
  }
  if (status === 401 || status === 403) {
    return 'Session expired or unauthorized access. Please log in again.';
  }
  if (status >= 500) {
    return 'Server error. Please try again later.';
  }
  return errorObj.message || 'Network request failed.';
}

/**
 * Extracts and maps a human-readable message from any error object.
 *
 * @param err - The raw error object to parse.
 * @returns User-friendly error message.
 */
export function getReadableErrorMessage(err: unknown): string {
  if (!err) {
    return 'An unexpected error occurred.';
  }
  const errorObj = err as Record<string, any>;

  // 1. Firebase Error Code
  const code = errorObj.code || errorObj.firebaseCode;
  if (typeof code === 'string' && code.startsWith('auth/')) {
    return getFirebaseErrorMessage(code);
  }

  // 2. Firebase error code in message regex
  const message = errorObj.message;
  if (typeof message === 'string') {
    const match = message.match(/auth\/[a-zA-Z0-9-]+/);
    if (match) {
      return getFirebaseErrorMessage(match[0]);
    }
  }

  // 3. Axios Error handling
  if (errorObj.isAxiosError || errorObj.response || errorObj.request) {
    return getAxiosErrorMessage(errorObj);
  }

  // 4. Default message fallback
  if (typeof message === 'string') {
    return message.includes('Firebase:') ? message.replace('Firebase:', '').trim() : message;
  }
  return 'An unexpected error occurred. Please try again.';
}
