import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { UserProfile } from '@/types/api.types';
import { PriestAuthState } from '@/types/api.types';
import { UserLocation } from '@/types/home.types';
import { NotificationPreferences } from '@/types/profile.types';

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
  /** Devotee current device location state. */
  userLocation: UserLocation;
  /** ISO date string representing registration timestamp. */
  createdAt: string;
  /** Devotee notification toggle configurations. */
  notificationPrefs: NotificationPreferences;
}

const initialState: UserState = {
  name: '',
  email: '',
  phone: '',
  profilePicture: null,
  userType: null,
  priestState: null,
  userLocation: {
    coordinates: null,
    cityName: null,
    permissionStatus: 'undetermined',
    lastFetched: null,
  },
  createdAt: '',
  notificationPrefs: {
    bookingConfirmations: true,
    upcomingReminders: true,
    cancellationAlerts: true,
    festivalOffers: true,
    newFeatures: true,
  },
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
      state.createdAt = user.createdAt || '';

      const notifications = user.notifications;
      if (notifications) {
        state.notificationPrefs = {
          bookingConfirmations: notifications.push?.bookingUpdates ?? true,
          upcomingReminders: notifications.push?.reminders ?? true,
          cancellationAlerts: notifications.push?.bookingUpdates ?? true,
          festivalOffers: notifications.push?.promotions ?? true,
          newFeatures: notifications.push?.promotions ?? true,
        };
      }
    },

    /**
     * Updates the user's name locally.
     */
    updateUserName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },

    /**
     * Updates the local user profile state with partial data.
     */
    updateUserProfile(
      state,
      action: PayloadAction<Partial<UserProfile & { notificationPrefs: NotificationPreferences }>>
    ) {
      const partial = action.payload;
      if (partial.name !== undefined) state.name = partial.name;
      if (partial.phone !== undefined) state.phone = partial.phone;
      if (partial.profilePicture !== undefined) state.profilePicture = partial.profilePicture;
      if (partial.email !== undefined) state.email = partial.email;
      if (partial.notificationPrefs !== undefined) {
        state.notificationPrefs = {
          ...state.notificationPrefs,
          ...partial.notificationPrefs,
        };
      }
    },

    /**
     * Updates the stored user location in Redux state.
     */
    setUserLocation(state, action: PayloadAction<UserLocation>) {
      state.userLocation = action.payload;
    },

    /**
     * Clears the user session on logout.
     */
    clearUserSession() {
      return initialState;
    },
  },
});

export const {
  setUserSession,
  clearUserSession,
  updateUserName,
  setUserLocation,
  updateUserProfile,
} = userSlice.actions;

export default userSlice.reducer;
