// src/redux/slices/devoteeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

// Define types for Priest and Booking
interface Priest {
  _id: string;
  name: string;
  // Add any other fields related to priests here
}

interface Booking {
  _id: string;
  priestId: string;
  devoteeId: string;
  date: string;
  status: string;
  // Add any other fields related to bookings here
}

interface DevoteeState {
  priests: Priest[];
  selectedPriest: Priest | null;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

// Define the type for the searchParams (adjust as necessary based on your API)
interface SearchParams {
  name?: string;
  location?: string;
  // Add any other parameters that are used to search priests
}

// Search priests
export const searchPriests = createAsyncThunk<Priest[], SearchParams, { rejectValue: string }>(
  'devotee/searchPriests',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/devotee/priests', { params: searchParams });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search priests');
    }
  }
);

// Get priest details
export const getPriestDetails = createAsyncThunk<Priest, string, { rejectValue: string }>(
  'devotee/getPriestDetails',
  async (priestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/devotee/priests/${priestId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch priest details');
    }
  }
);

// Create booking
export const createBooking = createAsyncThunk<Booking, Booking, { rejectValue: string }>(
  'devotee/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/devotee/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

const initialState: DevoteeState = {
  priests: [],
  selectedPriest: null,
  bookings: [],
  isLoading: false,
  error: null,
};

const devoteeSlice = createSlice({
  name: 'devotee',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle searchPriests
      .addCase(searchPriests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchPriests.fulfilled, (state, action: PayloadAction<Priest[]>) => {
        state.isLoading = false;
        state.priests = action.payload;
      })
      .addCase(searchPriests.rejected, (state, action: PayloadAction<string | undefined>) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Failed to search priests';
          })
      // Handle getPriestDetails
      .addCase(getPriestDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPriestDetails.fulfilled, (state, action: PayloadAction<Priest>) => {
        state.isLoading = false;
        state.selectedPriest = action.payload;
      })
      .addCase(getPriestDetails.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch priest details';
      })
      // Handle createBooking
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.isLoading = false;
        // Optionally update the state with the new booking
        state.bookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create booking';
      });
  },
});

export const { clearError } = devoteeSlice.actions;
export default devoteeSlice.reducer;
