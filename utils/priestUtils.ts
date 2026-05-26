/**
 * Utility functions specific to priest business logic and onboarding.
 */

/** 
 * Determines if a priest has completed onboarding.
 * Uses verificationStatus as fallback for priests created
 * before the onboardingCompleted field existed.
 *
 * @param onboardingCompleted - Flag representing whether the priest completed wizard steps.
 * @param verificationStatus - The registration verification status from the profile.
 * @returns True if onboarding is complete or profile was submitted, otherwise false.
 */
export function hasPriestCompletedOnboarding(
  onboardingCompleted: boolean | undefined,
  verificationStatus: string | undefined
): boolean {
  if (onboardingCompleted === true) return true;
  const submittedStatuses = ['pending', 'approved', 'rejected'];
  if (verificationStatus && submittedStatuses.includes(verificationStatus)) {
    return true;
  }
  return false;
}
