import { configureStore, combineReducers, Action, Reducer } from '@reduxjs/toolkit';

import onboardingReducer from './slices/onboardingSlice';
import userReducer from './slices/userSlice';
import exploreReducer from './slices/exploreSlice';
import bookingReducer from './slices/bookingSlice';
import priestDashboardReducer from './slices/priestDashboardSlice';

const appReducer = combineReducers({
  onboarding: onboardingReducer,
  user: userReducer,
  explore: exploreReducer,
  booking: bookingReducer,
  priestDashboard: priestDashboardReducer,
});

type AppState = ReturnType<typeof appReducer>;

// Dispatching { type: 'RESET_ALL' } resets every slice to its initial state —
// used on logout to prevent cross-user data bleed.
const rootReducer: Reducer<AppState> = (state: AppState | undefined, action: Action) => {
  if (action.type === 'RESET_ALL') {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/**
 * TypeScript type representing the complete global state tree of the Redux store.
 */
export type RootState = ReturnType<typeof appReducer>;

/**
 * TypeScript type representing the dispatch function for dispatching actions to the Redux store.
 */
export type AppDispatch = typeof store.dispatch;
