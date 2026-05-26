/**
 * Hardcoded options for onboarding wizard step selections.
 * These are UI presentation values — not fetched from the backend.
 */

/** Languages a priest may speak, used in Step 1. */
export const LANGUAGE_OPTIONS: string[] = [
  'Hindi',
  'Sanskrit',
  'English',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Gujarati',
  'Bengali',
  'Marathi',
  'Odia',
  'Punjabi',
];

/** Religious traditions for Step 2 section 1. */
export const TRADITION_OPTIONS: string[] = [
  'Hindu',
  'Buddhist',
  'Jain',
  'Sikh',
  'Christian',
  'Muslim',
  'Other',
];

/**
 * Ceremony specializations for Step 2 section 2.
 * These match backend Ceremony category names.
 */
export const SPECIALIZATION_OPTIONS: string[] = [
  'Griha Pravesh',
  'Satyanarayan Puja',
  'Wedding Ceremonies',
  'Naming Ceremony',
  'Thread Ceremony',
  'Last Rites',
  'Navratri Puja',
  'Ganesh Puja',
  'Lakshmi Puja',
  'Vastu Shanti',
  'Havan / Homam',
  'Katha / Pravachan',
  'Pitru Paksha',
  'Graha Shanti',
];

/** Biography minimum character requirement for validation. */
export const BIO_MIN_LENGTH = 50;

/** Biography maximum character limit. */
export const BIO_MAX_LENGTH = 500;

/** Stepper minimum value for experience years. */
export const EXPERIENCE_MIN = 1;

/** Stepper maximum value for experience years. */
export const EXPERIENCE_MAX = 50;

/** Pixel diameter of the profile avatar circle. */
export const AVATAR_SIZE = 48;

/** Chip horizontal padding in pixels. */
export const CHIP_PADDING_H = 16;

/** Chip vertical padding in pixels. */
export const CHIP_PADDING_V = 8;

/** Stepper button diameter in pixels. */
export const STEPPER_BTN_SIZE = 36;

/** Minimum width of the experience value display. */
export const STEPPER_VALUE_MIN_WIDTH = 60;

// ---------------------------------------------------------------------------
// Step 3 — Services & Pricing
// ---------------------------------------------------------------------------

/**
 * Duration options for the service form dropdown.
 * value is stored in durationMinutes in Redux and sent to the backend.
 */
export const DURATION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '1 hr 30 min', value: 90 },
  { label: '2 hrs', value: 120 },
  { label: '2 hrs 30 min', value: 150 },
  { label: '3 hrs', value: 180 },
  { label: '4 hrs', value: 240 },
  { label: '5 hrs', value: 300 },
  { label: '6+ hrs', value: 360 },
];

/** Maximum allowable price (INR) for a single service listing. */
export const PRICE_MAX = 100000;

/** Width percentage given to each column in the two-column form row. */
export const FORM_COL_WIDTH = '48%';

