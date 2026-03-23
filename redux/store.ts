import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import priestReducer from './slices/priestSlice';
import onboardingReducer from './slices/onboardingSlice';

// Define the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    priest: priestReducer,
    booking: bookingReducer,
    onboarding: onboardingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Optional: Define RootState and AppDispatch types for type safety
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
