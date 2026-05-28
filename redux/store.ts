import { configureStore } from '@reduxjs/toolkit';

import onboardingReducer from './slices/onboardingSlice';
import userReducer from './slices/userSlice';
import exploreReducer from './slices/exploreSlice';

/**
 * Global Redux store configuration.
 * Registers the onboarding, user, and explore slices.
 */
export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    user: userReducer,
    explore: exploreReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/**
 * TypeScript type representing the complete global state tree of the Redux store.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * TypeScript type representing the dispatch function for dispatching actions to the Redux store.
 */
export type AppDispatch = typeof store.dispatch;
