// src/redux/slices/priestSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import priestService from '../../services/priestService';

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
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
  availableBalance: number;
  transactions: any[];
  totalBookings: number;
  totalCompletedBookings: number;
  pujasCompleted: number;
  pujasPending: number;
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
      const data = await priestService.getProfile();
      return data;
    } catch (error: any) {
      return rejectWithValue(typeof error === 'string' ? error : error.message || 'Failed to fetch profile');
    }
  }
);

// Get bookings
export const getBookings = createAsyncThunk<Booking[], string | undefined, { rejectValue: string }>(
  'priest/getBookings',
  async (priestId, { rejectWithValue }) => {
    try {
      const data = await priestService.getBookings(priestId);
      return Array.isArray(data) ? data : data?.data || [];
    } catch (error: any) {
      return rejectWithValue(typeof error === 'string' ? error : error.message || 'Failed to fetch bookings');
    }
  }
);

// Get earnings — accepts priestId so the backend can query by priest
export const getEarnings = createAsyncThunk<Earnings, string, { rejectValue: string }>(
  'priest/getEarnings',
  async (priestId, { rejectWithValue }) => {
    try {
      const data = await priestService.getEarnings(priestId);
      return data;
    } catch (error: any) {
      return rejectWithValue(typeof error === 'string' ? error : error.message || 'Failed to fetch earnings');
    }
  }
);

export const updateProfile = createAsyncThunk<PriestProfile, Partial<PriestProfile>, { rejectValue: string }>(
  'priest/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await priestService.updateProfile(profileData);
      return data;
    } catch (error: any) {
      return rejectWithValue(typeof error === 'string' ? error : error.message || 'Failed to update profile');
    }
  }
);

const defaultEarnings: Earnings = {
  thisMonth: 0,
  lastMonth: 0,
  growthPercentage: 0,
  availableBalance: 0,
  transactions: [],
  totalBookings: 0,
  totalCompletedBookings: 0,
  pujasCompleted: 0,
  pujasPending: 0,
};

const initialState: PriestState = {
  profile: null,
  bookings: [],
  earnings: defaultEarnings,
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
      .addCase(getProfile.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch profile';
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
      .addCase(getBookings.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch bookings';
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
      .addCase(getEarnings.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch earnings';
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
      .addCase(updateProfile.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update profile';
      });
  },
});

export const { clearError } = priestSlice.actions;
export default priestSlice.reducer;
