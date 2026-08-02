/**
 * Represents a booking entry displayed on the priest's schedule calendar.
 */
export interface CalendarBooking {
  /** Unique booking identifier. */
  _id: string;
  /** Type or name of the ceremony. */
  ceremonyType: string;
  /** Date of the ceremony in "YYYY-MM-DD" local format. */
  date: string;
  /** Start time in 24-hour "HH:MM" format. */
  startTime: string;
  /** End time in 24-hour "HH:MM" format. */
  endTime: string;
  /** Current status of the booking (e.g. 'confirmed', 'completed'). */
  status: string;
  /** Reference details of the devotee who booked the ceremony. */
  devoteeId: {
    /** Unique devotee identifier. */
    _id: string;
    /** Display name of the devotee. */
    name: string;
    /** Optional devotee profile picture URL. */
    profilePicture?: string;
    /** Optional devotee phone number. */
    phone?: string;
    /** Optional devotee registration date. */
    createdAt?: string;
  };
  /** Base price of the ceremony package (in INR). */
  basePrice: number;
  /** Location details where the puja takes place. */
  location: {
    /** Full address description. */
    address: string;
  };
  /** Optional transaction/payment confirmation metadata. */
  paymentDetails?: {
    /** Unique receipt number generated post payment success. */
    receiptNumber?: string;
  };
}

/**
 * Marked dates config map formatting required by react-native-calendars.
 */
export type MarkedDatesMap = Record<
  string,
  {
    /** Dots list indicating events scheduled on this day. */
    dots?: Array<{ color: string }>;
    /** Highlights this date as currently selected by the user. */
    selected?: boolean;
    /** The color used to render the selected date highlight background. */
    selectedColor?: string;
    /** Renders the outline today indicator. */
    today?: boolean;
  }
>;
