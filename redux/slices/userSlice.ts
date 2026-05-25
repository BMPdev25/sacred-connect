import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { UserProfile } from '@/types/api.types';
import { PriestAuthState } from '@/types/api.types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

/**
 * Redux state for the currently authenticated user's profile.
 */
export interface UserState {
  /** Full display name of the authenticated user. */
  name: string;
  /** Primary email address. */
  email: string;
  /** Primary phone number. */
  phone: string;
  /** URL of the user's profile picture, if available. */
  profilePicture: string | null;
  /** The user's role in the application. */
  userType: 'devotee' | 'priest' | 'admin' | null;
  /** Priest-specific onboarding and verification state, if applicable. */
  priestState: PriestAuthState | null;
}

const initialState: UserState = {
  name: '',
  email: '',
  phone: '',
  profilePicture: null,
  userType: null,
  priestState: null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/**
 * Redux slice for managing the authenticated user's profile data.
 * Populated once from the backend response after login — never used for routing.
 */
export const userSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Populates the user session from a backend profile response.
     * Dispatched once after a successful Firebase + backend sync.
     */
    setUserSession(
      state,
      action: PayloadAction<{ user: UserProfile; priestState?: PriestAuthState }>
    ) {
      const { user, priestState } = action.payload;
      state.name = user.name || '';
      state.email = user.email || '';
      state.phone = user.phone || '';
      state.profilePicture = user.profilePicture || null;
      state.userType = user.userType || null;
      state.priestState = priestState || null;
    },

    /**
     * Clears the user session on logout.
     */
    clearUserSession() {
      return initialState;
    },
  },
});

export const { setUserSession, clearUserSession } = userSlice.actions;

export default userSlice.reducer;
