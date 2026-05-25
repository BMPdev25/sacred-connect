import { UserProfile, PriestAuthState, UserType } from './api.types';

/**
 * Payload sent to registration endpoint for registering a new Devotee.
 */
export interface SignupDevoteePayload {
  /** Full name of the devotee. */
  name: string;
  /** Primary email address. */
  email: string;
  /** Primary contact phone number. */
  phone: string;
  /** Password for authentication. */
  password?: string;
  /** Fixed role indicating 'devotee'. */
  role: 'devotee';
}

/**
 * Payload sent to registration endpoint for registering a new Priest.
 */
export interface SignupPriestPayload {
  /** Full name of the priest. */
  name: string;
  /** Primary email address. */
  email: string;
  /** Primary contact phone number. */
  phone: string;
  /** Password for authentication. */
  password?: string;
  /** Fixed role indicating 'priest'. */
  role: 'priest';
}

/**
 * Payload representing credentials needed to authenticate.
 * Supports standard email/password combo or phone/otp combo.
 */
export type LoginPayload = 
  | {
      /** Primary email address. */
      email: string;
      /** Password corresponding to the email. */
      password: string;
    }
  | {
      /** Primary contact phone number. */
      phone: string;
      /** One-time password sent to phone. */
      otp: string;
    };

/**
 * Payload to synchronize authentication status between client/Firebase and backend.
 */
export interface AuthSyncPayload {
  /** Firebase Authentication ID token. */
  firebaseToken: string;
  /** Optional name to update or associate during sync. */
  name?: string;
  /** Optional phone to update or associate during sync. */
  phone?: string;
  /** Optional user type to set or sync. */
  userType?: UserType;
}

/**
 * State shape for Redux auth slice tracking the current user session.
 */
export interface AuthState {
  /** Flag showing if the user is authenticated. */
  isAuthenticated: boolean;
  /** Flag representing active authentication network/storage operation. */
  isLoading: boolean;
  /** Profile details of the logged-in user, or null if unauthenticated. */
  user: UserProfile | null;
  /** Onboarding/Verification state details if user is a priest, otherwise null. */
  priestState: PriestAuthState | null;
  /** Error message from failed authentication operations, if any. */
  error: string | null;
  /** Flag indicating if the application has been launched before. */
  hasLaunchedBefore: boolean;
}
