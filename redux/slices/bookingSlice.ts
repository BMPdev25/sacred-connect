// src/redux/slices/bookingSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// Define types for the Booking and State
interface Booking {
  _id: string;
  userId: string;
  status: string;
  date: string;
  // Add any other booking-specific fields here
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

// Get user bookings
export const getBookings = createAsyncThunk<Booking[], void, { rejectValue: string }>(
  'booking/getBookings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { userToken } = getState().auth;
      const response = await api.get('/api/devotee/bookings', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Update booking status
export const updateBookingStatus = createAsyncThunk<Booking, { bookingId: string; status: string }, { rejectValue: string }>(
  'booking/updateStatus',
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/bookings/status', { bookingId, status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking status');
    }
  }
);

// Submit rating and review
export const submitRating = createAsyncThunk<any, { rating: number; review: string }, { rejectValue: string }>(
  'booking/submitRating',
  async (ratingData, { rejectWithValue, getState }) => {
    try {
      // Get the auth token from state
      const { userToken } = getState().auth;

      if (!userToken) {
        return rejectWithValue('Authentication required');
      }

      const response = await api.post('/api/ratings', ratingData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Submit rating API error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to submit rating');
    }
  }
);

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getBookings
      .addCase(getBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.isLoading = false;
        state.bookings = action.payload;
      })
      .addCase(getBookings.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Handle updateBookingStatus
      .addCase(updateBookingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.isLoading = false;
        // Update the booking in the bookings array
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Handle submitRating
      .addCase(submitRating.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.isLoading = false;
        // Rating submitted successfully
      })
      .addCase(submitRating.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
