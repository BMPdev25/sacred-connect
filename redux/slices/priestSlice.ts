// src/redux/slices/priestSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// Define types for Priest Profile and Booking
interface PriestProfile {
  _id: string;
  name: string;
  email: string;
  // Add any other fields related to the priest profile here
}

interface Booking {
  _id: string;
  devoteeId: string;
  date: string;
  status: string;
  // Add any other fields related to bookings here
}

interface Earnings {
  total: number;
  completed: number;
  pending: number;
  // Add any other earnings-related fields
}

interface PriestState {
  profile: PriestProfile | null;
  bookings: Booking[];
  earnings: Earnings | null;
  isLoading: boolean;
  error: string | null;
}

// Get priest profile
export const getProfile = createAsyncThunk<PriestProfile, void, { rejectValue: string }>(
  'priest/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/priest/profile');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Get bookings
export const getBookings = createAsyncThunk<Booking[], void, { rejectValue: string }>(
  'priest/getBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/priest/bookings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Get earnings
export const getEarnings = createAsyncThunk<Earnings, void, { rejectValue: string }>(
  'priest/getEarnings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/priest/earnings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings');
    }
  }
);

// Update priest profile
export const updateProfile = createAsyncThunk<PriestProfile, Partial<PriestProfile>, { rejectValue: string }>(
  'priest/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/priest/profile', profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const initialState: PriestState = {
  profile: null,
  bookings: [],
  earnings: null,
  isLoading: false,
  error: null,
};

const priestSlice = createSlice({
  name: 'priest',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getProfile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<PriestProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(getProfile.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
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
      // Handle getEarnings
      .addCase(getEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEarnings.fulfilled, (state, action: PayloadAction<Earnings>) => {
        state.isLoading = false;
        state.earnings = action.payload;
      })
      .addCase(getEarnings.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Handle updateProfile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<PriestProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = priestSlice.actions;
export default priestSlice.reducer;
