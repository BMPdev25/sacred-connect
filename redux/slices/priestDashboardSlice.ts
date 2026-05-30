import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DashboardStats,
  PriestOnlineStatus,
  TodayBooking,
} from '@/types/priest.dashboard.types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

/**
 * State representing the priest dashboard state, statistics, schedule and pending request counters.
 */
export interface PriestDashboardState {
  /** The current status of the priest ('available', 'busy', 'offline'). */
  currentStatus: PriestOnlineStatus;
  /** Flag representing if status change request is in flight. */
  isTogglingStatus: boolean;
  /** Counter tracking the number of pending booking requests. */
  pendingRequestsCount: number;
  /** Sorted list of bookings scheduled for today. */
  todayBookings: TodayBooking[];
  /** Stats metrics for the priest (ratings, bookings, earnings). */
  stats: DashboardStats | null;
}

const initialState: PriestDashboardState = {
  currentStatus: 'offline',
  isTogglingStatus: false,
  pendingRequestsCount: 0,
  todayBookings: [],
  stats: null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/**
 * Redux slice for managing the priest's active dashboard data and availability state.
 */
export const priestDashboardSlice = createSlice({
  name: 'priestDashboard',
  initialState,
  reducers: {
    /**
     * Set the current online/busy/offline status of the priest.
     */
    setCurrentStatus(state, action: PayloadAction<PriestOnlineStatus>) {
      state.currentStatus = action.payload;
    },

    /**
     * Set status toggle progress indicator state.
     */
    setIsTogglingStatus(state, action: PayloadAction<boolean>) {
      state.isTogglingStatus = action.payload;
    },

    /**
     * Set the total number of pending booking requests.
     */
    setPendingRequestsCount(state, action: PayloadAction<number>) {
      state.pendingRequestsCount = action.payload;
    },

    /**
     * Set the list of bookings scheduled for today.
     */
    setTodayBookings(state, action: PayloadAction<TodayBooking[]>) {
      state.todayBookings = action.payload;
    },

    /**
     * Set the quick statistics data for the dashboard.
     */
    setStats(state, action: PayloadAction<DashboardStats>) {
      state.stats = action.payload;
    },

    /**
     * Increment the count of pending booking requests by 1.
     */
    incrementPendingRequests(state) {
      state.pendingRequestsCount += 1;
    },

    /**
     * Decrement the count of pending booking requests by 1, with a lower bound of 0.
     */
    decrementPendingRequests(state) {
      state.pendingRequestsCount = Math.max(0, state.pendingRequestsCount - 1);
    },
  },
});

export const {
  setCurrentStatus,
  setIsTogglingStatus,
  setPendingRequestsCount,
  setTodayBookings,
  setStats,
  incrementPendingRequests,
  decrementPendingRequests,
} = priestDashboardSlice.actions;

export default priestDashboardSlice.reducer;
