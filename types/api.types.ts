/**
 * Represents a successful API response with data and a message.
 * @template T - The type of the data returned by the API.
 */
export interface ApiSuccess<T> {
  /** Indicates the request was successful. */
  success: true;
  /** The payload returned from the server. */
  data: T;
  /** Success message from the server. */
  message: string;
}

/**
 * Represents a failed API response with error message and error code.
 */
export interface ApiError {
  /** Indicates the request failed. */
  success: false;
  /** Human-readable error description. */
  error: string;
  /** Machine-readable error code. */
  code: string;
}

/**
 * Union type representing either a successful or failed API response.
 * @template T - The type of the data returned in a success scenario.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * User types available in the Sacred Connect platform.
 */
export type UserType = 'devotee' | 'priest' | 'admin';

/**
 * Priest verification status options.
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/**
 * Supported authentication providers.
 */
export type AuthProvider = 'firebase' | 'local' | 'otp' | 'google';

/**
 * Profile details of a registered user.
 */
export interface UserProfile {
  /** Unique MongoDB document identifier. */
  _id: string;
  /** Full name of the user. */
  name: string;
  /** Primary email address. */
  email: string;
  /** Primary contact phone number. */
  phone: string;
  /** Role classification of the user. */
  userType: UserType;
  /** Firebase Authentication UID. */
  firebaseUid: string;
  /** Optional URL of the user's profile picture. */
  profilePicture?: string;
  /** Optional Expo push token for notifications. */
  expoPushToken?: string;
  /** Method used for registration/authentication. */
  authProvider: AuthProvider;
  /** Flag representing email validation state. */
  isEmailVerified: boolean;
  /** ISO date string representing registration timestamp. */
  createdAt: string;
  /** ISO date string representing last update timestamp. */
  updatedAt: string;
}

/**
 * Internal state tracking priest verification and onboarding progress.
 */
export interface PriestAuthState {
  /** Verification status of the priest. */
  verificationStatus: VerificationStatus;
  /** Flag indicating whether onboarding step wizard is completed. */
  onboardingCompleted: boolean;
  /** Current active step in onboarding wizard (steps 1-6). */
  onboardingCurrentStep: number;
}
