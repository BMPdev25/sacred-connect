import { configureStore } from '@reduxjs/toolkit';

import onboardingReducer from './slices/onboardingSlice';

/**
 * Global Redux store configuration.
 * Registers the onboarding slice.
 */
export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
  },
});

/**
 * TypeScript type representing the complete global state tree of the Redux store.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * TypeScript type representing the dispatch function for dispatching actions to the Redux store.
 */
export type AppDispatch = typeof store.dispatch;
