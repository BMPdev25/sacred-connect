import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PLATFORM_FEE_PERCENTAGE } from '@/constants/config';
import {
  BookingDraft,
  BookingPriceBreakdown,
  BookingServiceSelection,
  DevoteeAddress,
  TimeSlot,
} from '@/types/booking.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pure helper function to calculate the booking price breakdown.
 *
 * @param basePrice - The base price of the selected ceremony service.
 * @returns The calculated price breakdown containing basePrice, platformFee, totalAmount, and feePercentageLabel.
 */
export function calculatePricing(basePrice: number): BookingPriceBreakdown {
  const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENTAGE);
  const totalAmount = basePrice + platformFee;
  const feePercentageLabel = (PLATFORM_FEE_PERCENTAGE * 100).toFixed(0) + '%';

  return {
    basePrice,
    platformFee,
    totalAmount,
    feePercentageLabel,
  };
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: BookingDraft = {
  priestProfileId: null,
  priestUserId: null,
  priestName: null,
  priestProfilePicture: null,
  priestRating: null,
  selectedService: null,
  selectedDate: null,
  selectedTimeSlot: null,
  selectedAddress: null,
  pricing: null,
  createdBookingId: null,
  razorpayOrderId: null,
  bookingReference: null,
  activeSection: 'service',
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/**
 * Payload interface for initializing the booking flow.
 */
export interface InitBookingFlowPayload {
  /** The priest profile ID */
  priestProfileId: string;
  /** The priest user ID (User._id) */
  priestUserId: string;
  /** The priest name */
  priestName?: string;
  /** The priest profile picture URL */
  priestProfilePicture?: string | null;
  /** The priest rating score */
  priestRating?: number | null;
  /** Optional service ID if preset */
  serviceId?: string;
  /** Optional ceremony ID if preset */
  ceremonyId?: string;
  /** Optional ceremony name if preset */
  ceremonyName?: string;
  /** Optional service duration in minutes if preset */
  durationMinutes?: number;
  /** Optional base price of the service if preset */
  basePrice?: number;
}

/**
 * Redux slice for managing the devotee's active booking draft.
 */
export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    /**
     * Initializes the booking flow by setting the priest context and resetting previous selections.
     * If a serviceId is present in the payload, it also sets the selected service and advances section.
     */
    initBookingFlow(state, action: PayloadAction<InitBookingFlowPayload>) {
      const {
        priestProfileId,
        priestUserId,
        priestName,
        priestProfilePicture,
        priestRating,
      } = action.payload;

      // If same priest, do not reset selections
      if (state.priestProfileId === priestProfileId) {
        return;  // already initialized for this priest, keep selections
      }

      // Reset state to initial and populate priest context
      Object.assign(state, initialState);
      state.priestProfileId = priestProfileId;
      state.priestUserId = priestUserId;
      state.priestName = priestName ?? null;
      state.priestProfilePicture = priestProfilePicture ?? null;
      state.priestRating = priestRating ?? null;
    },

    /**
     * Updates the display information of the priest.
     */
    updatePriestDisplayInfo(
      state,
      action: PayloadAction<{
        priestName?: string;
        priestProfilePicture?: string | null;
        priestRating?: number | null;
      }>
    ) {
      // Only update display fields, never touch selections
      if (action.payload.priestName !== undefined) {
        state.priestName = action.payload.priestName;
      }
      if (action.payload.priestProfilePicture !== undefined) {
        state.priestProfilePicture = action.payload.priestProfilePicture;
      }
      if (action.payload.priestRating !== undefined) {
        state.priestRating = action.payload.priestRating;
      }
    },

    /**
     * Sets the selected ceremony service and advances the active section to 'date'.
     * Also computes the platform fees and total price breakdown.
     */
    setSelectedService(state, action: PayloadAction<BookingServiceSelection>) {
      state.selectedService = action.payload;
      state.pricing = calculatePricing(action.payload.basePrice);
      state.activeSection = 'date';
    },

    /**
     * Sets the selected booking date, clears the previously selected time slot, and advances to 'time'.
     */
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
      state.selectedTimeSlot = null;
      state.activeSection = 'time';
    },

    /**
     * Sets the selected time slot and advances the active section to 'address'.
     */
    setSelectedTimeSlot(state, action: PayloadAction<TimeSlot>) {
      state.selectedTimeSlot = action.payload;
      state.activeSection = 'address';
    },

    /**
     * Sets the selected devotee address. Active section remains 'address'.
     */
    setSelectedAddress(state, action: PayloadAction<DevoteeAddress>) {
      state.selectedAddress = action.payload;
    },

    /**
     * Navigates to a specific section in the booking flow.
     */
    setActiveSection(state, action: PayloadAction<BookingDraft['activeSection']>) {
      state.activeSection = action.payload;
    },

    /**
     * Saves post-creation identifiers returned by the backend after draft booking is registered.
     */
    setCreatedBooking(
      state,
      action: PayloadAction<{
        bookingId: string;
        razorpayOrderId: string;
        bookingReference: string;
      }>
    ) {
      state.createdBookingId = action.payload.bookingId;
      state.razorpayOrderId = action.payload.razorpayOrderId;
      state.bookingReference = action.payload.bookingReference;
    },

    /**
     * Resets the active booking draft back to the initial blank state.
     */
    clearBookingDraft() {
      return initialState;
    },
  },
});

export const {
  initBookingFlow,
  setSelectedService,
  setSelectedDate,
  setSelectedTimeSlot,
  setSelectedAddress,
  setActiveSection,
  setCreatedBooking,
  clearBookingDraft,
  updatePriestDisplayInfo,
} = bookingSlice.actions;

export default bookingSlice.reducer;
