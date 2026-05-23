/**
 * The user-facing name of the application.
 */
export const APP_NAME = 'Sacred Connect';

/**
 * Timeout duration for API HTTP requests in milliseconds.
 */
export const API_TIMEOUT = 10000;

/**
 * Cooldown duration in seconds before a user can request another OTP code.
 */
export const OTP_RESEND_COOLDOWN = 60;

/**
 * Expiration duration for a sent OTP code in minutes.
 */
export const OTP_EXPIRY_MINUTES = 10;

/**
 * Maximum number of consecutive failed login attempts allowed before account lock/throttling.
 */
export const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Minimum required character length for user passwords.
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Expected character length of user phone numbers in India.
 */
export const PHONE_LENGTH = 10;

/**
 * AsyncStorage key used to track whether the onboarding flow has been completed.
 */
export const ONBOARDING_STORAGE_KEY = 'sc_has_launched';

/**
 * Service fee percentage taken from priest bookings.
 * Checked with backend: currently 0 as placeholder.
 */
export const PLATFORM_FEE_PERCENTAGE = 0;
