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

/**
 * Profile snapshot captured from a brand-new Google sign-in, before the
 * backend account exists. Read by /role-selection (to branch into the
 * Google-aware completion flow) and /signup-priest (to prefill + lock the
 * email/name fields). Cleared once registration completes or is abandoned.
 */
export interface PendingGoogleProfile {
  email: string;
  name?: string;
}

let pendingGoogleProfile: PendingGoogleProfile | null = null;

export function setPendingGoogleProfile(profile: PendingGoogleProfile | null): void {
  pendingGoogleProfile = profile;
}

export function getPendingGoogleProfile(): PendingGoogleProfile | null {
  return pendingGoogleProfile;
}
