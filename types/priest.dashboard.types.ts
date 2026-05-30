/**
 * Represents the online/availability status of a priest.
 */
export type PriestOnlineStatus = 'available' | 'busy' | 'offline';

/**
 * A booking structure for the priest's schedule for the current calendar day.
 */
export interface TodayBooking {
  /** Unique booking identifier. */
  _id: string;
  /** Type or name of the ceremony. */
  ceremonyType: string;
  /** Start time of the ceremony in "HH:MM" 24-hour format. */
  startTime: string; // "HH:MM"
  /** End time of the ceremony in "HH:MM" 24-hour format. */
  endTime: string; // "HH:MM"
  /** Date of the ceremony in "YYYY-MM-DD" format. */
  date: string; // "YYYY-MM-DD"
  /** Status of the booking (e.g. 'confirmed', 'in_progress'). */
  status: string;
  /** Reference to the devotee who booked the ceremony. */
  devoteeId: {
    /** Unique devotee identifier. */
    _id: string;
    /** Display name of the devotee. */
    name: string;
    /** Optional profile picture URL. */
    profilePicture?: string;
  };
}

/**
 * Quick statistics for the priest dashboard.
 */
export interface DashboardStats {
  /** Total earnings credited during the current calendar month. */
  thisMonth: number;
  /** All-time count of completed bookings. */
  totalBookings: number;
  /** Average star rating of the priest. */
  rating: number;
  /** Wallet balance pending payout. */
  pendingPayout: number;
}

/**
 * A pending booking request presented to the priest for acceptance or rejection.
 */
export interface BookingRequest {
  /** Unique booking request identifier. */
  _id: string;
  /** Type or name of the ceremony. */
  ceremonyType: string;
  /** Date of the ceremony in "YYYY-MM-DD" format. */
  date: string; // "YYYY-MM-DD"
  /** Start time of the ceremony in "HH:MM" 24-hour format. */
  startTime: string;
  /** End time of the ceremony in "HH:MM" 24-hour format. */
  endTime: string;
  /** Base earnings price for the priest from this ceremony. */
  basePrice: number;
  /** Ceremony location details. */
  location: {
    /** Full address description. */
    address: string;
    /** Extracted city name. */
    city: string;
  };
  /** Reference details of the devotee. */
  devoteeId: {
    /** Unique devotee identifier. */
    _id: string;
    /** Display name of the devotee. */
    name: string;
    /** Optional profile picture URL. */
    profilePicture?: string;
    /** Devotee registration creation timestamp. */
    createdAt: string;
  };
  /** Request creation timestamp. */
  createdAt: string;
}

/**
 * Detailed view data structure of a single booking request.
 */
export interface BookingRequestDetail extends BookingRequest {
  /** Total duration of the ceremony in minutes. */
  durationMinutes: number;
  /** Distance in kilometers from the priest's home base location. */
  distance?: number;
}
