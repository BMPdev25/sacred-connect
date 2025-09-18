import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import devoteeReducer from './slices/devoteeSlice';
import priestReducer from './slices/priestSlice';

// Define the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    priest: priestReducer,
    devotee: devoteeReducer,
    booking: bookingReducer,
  },
});

// Optional: Define RootState and AppDispatch types for type safety
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
