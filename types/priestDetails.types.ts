/**
 * Sub-category ratings attached to each review.
 */
export interface ReviewCategories {
  /** Rating for punctuality (1-5) */
  punctuality: number;
  /** Rating for religious/scriptural knowledge (1-5) */
  knowledge: number;
  /** Rating for behavior and attitude (1-5) */
  behavior: number;
  /** Overall combined rating (1-5) */
  overall: number;
}

/**
 * A single review from a devotee.
 */
export interface PriestReview {
  /** Unique identifier of the review */
  _id: string;
  /** Associated booking ID */
  bookingId: string;
  /** Overall rating (1-5) */
  rating: number;
  /** Breakdown categories of the rating */
  categories: ReviewCategories;
  /** Optional written feedback text */
  review?: string;
  /** Name/type of the ceremony performed */
  ceremonyType: string;
  /** Date when the ceremony was performed */
  ceremonyDate: string;
  /** Timestamp when the review was created */
  timestamp: string;
  /** Date string of review creation */
  createdAt: string;
  /** Information of the devotee who left the review */
  userId: {
    /** Devotee's user identifier */
    _id: string;
    /** Devotee's name */
    name: string;
    /** Optional devotee's profile picture URL */
    profilePicture?: string;
  };
}

/**
 * Rating breakdown for display (5★ to 1★ percentages).
 */
export interface RatingBreakdown {
  /** Number of stars (1 to 5) */
  stars: 5 | 4 | 3 | 2 | 1;
  /** Count of reviews with this star rating */
  count: number;
  /** Calculated percentage of total reviews (0-100) */
  percentage: number;
}

/**
 * Availability slot for display.
 */
export interface AvailabilitySlot {
  /** Human-readable date label, e.g. "Today" or "Tomorrow, Fri 30 May" */
  label: string;
  /** Formatted time range, e.g. "3:00 PM – 8:00 PM", or null if not specified */
  timeRange: string | null;
  /** True when label is "Today" and no time slot is defined */
  isAvailableToday: boolean;
}

/**
 * Full public priest profile details.
 */
export interface PublicPriestProfile {
  /** Unique identifier of the priest profile */
  _id: string;
  /** Priest's name */
  name: string;
  /** Optional profile picture URL */
  profilePicture?: string;
  /** Years of religious experience */
  experience: number;
  /** Religious tradition/school followed */
  religiousTradition: string;
  /** Optional bio/description */
  description?: string;
  /** Services offered by the priest */
  services: Array<{
    /** Unique identifier of the service mapping */
    _id: string;
    /** Associated ceremony details */
    ceremonyId: {
      /** Unique identifier of the ceremony */
      _id: string;
      /** Name of the ceremony */
      name: string;
      /** Optional explanation of the ceremony */
      description?: string;
    };
    /** Booking price in INR */
    price: number;
    /** Ceremony duration in minutes */
    durationMinutes: number;
  }>;
  /** List of languages spoken */
  languages: string[];
  /** Aggregate ratings statistics */
  ratings: {
    /** Average star rating (0-5) */
    average: number;
    /** Total number of reviews received */
    count: number;
  };
  /** Specialized areas of puja or ritual expertises */
  specializations: Array<{
    /** Name of the specialization */
    name: string;
    /** Years of experience in this specialization */
    experience?: number;
  }>;
  /** Maximum travel distance in kilometers */
  serviceRadiusKm: number;
  /** Total number of ceremonies successfully completed */
  ceremonyCount: number;
  /** Real-time status indication */
  currentAvailability: {
    /** Status: available, busy, or offline */
    status: 'available' | 'busy' | 'offline';
  };
  /** Calendar schedule availability */
  availability: {
    /** Default weekly schedule (day name mapping to 24h slots) */
    weeklySchedule: Record<string, string[]>;
  };
  /** True if the profile is verified */
  isVerified: boolean;
  /** Verification status code string */
  verificationStatus: string;
}

/**
 * Reviews paginated response.
 */
export interface ReviewsPage {
  /** Mapped list of priest reviews */
  reviews: PriestReview[];
  /** Pagination metadata */
  pagination: {
    /** Total number of reviews matching */
    total: number;
    /** Current page index */
    page: number;
    /** Limit size per page */
    limit: number;
    /** Indicator if more pages are available */
    hasMore: boolean;
  };
}
