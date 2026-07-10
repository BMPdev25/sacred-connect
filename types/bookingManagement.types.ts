/**
 * Lifecycle status of a booking.
 */
export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

/**
 * A booking item in the list view.
 */
export interface BookingListItem {
  _id: string;
  ceremonyType: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  status: BookingStatus;
  paymentStatus: string;
  totalAmount: number;
  basePrice: number;
  platformFee: number;
  priestId: {
    _id: string;
    name: string;
    profilePicture?: string | { url?: string };
  } | null;
  devoteeId: string;
  location: {
    address: string;
  };
  paymentDetails?: {
    receiptNumber?: string;
    rzpOrderId?: string;
  };
  createdAt: string;
  updatedAt: string;
  priestProfile?: {
    _id: string;
    ratings?: any;
    experience?: number;
    religiousTradition?: string;
  };
}

/**
 * Derived display properties for a booking card.
 */
export interface BookingCardDisplay {
  badgeLabel: string;
  badgeBackground: string;
  badgeTextColor: string;
  actionLabel: string;
  actionVariant: 'outline' | 'ghost';
}

/**
 * A submitted rating.
 */
export interface RatingSubmission {
  bookingId: string;
  priestId: string; // priest User._id
  rating: number; // 1-5 overall
  categories: {
    punctuality: number;
    knowledge: number;
    behavior: number;
    overall: number;
  };
  review?: string;
  ceremonyType: string;
  ceremonyDate: string;
}

/**
 * Existing rating fetched for a booking.
 */
export interface ExistingRating {
  _id: string;
  rating: number;
  categories: {
    punctuality: number;
    knowledge: number;
    behavior: number;
    overall: number;
  };
  review?: string;
  createdAt: string;
}

/**
 * Paginated bookings response.
 */
export interface BookingListResponse {
  data: {
    upcoming?: BookingListItem[];
    past?: BookingListItem[];
    all?: BookingListItem[];
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
