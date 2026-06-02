/**
 * Shared signup semaphore used by authService and authStateManager.
 * Lives in its own module to avoid the circular import that would result
 * from authService importing authStateManager (which already imports authService).
 */

let isSignupInProgress = false;

export function setSignupInProgress(value: boolean): void {
  isSignupInProgress = value;
  console.log('[Auth] Signup in progress:', value);
}

export function getIsSignupInProgress(): boolean {
  return isSignupInProgress;
}
