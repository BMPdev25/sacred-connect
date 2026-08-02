/**
 * A promotional banner for the home screen carousel.
 */
export interface Banner {
  /** MongoDB ObjectId string. */
  _id: string;
  /** Primary title of the banner. */
  title: string;
  /** Optional secondary subtitle. */
  subtitle?: string;
  /** Optional Cloudinary URL for the banner image. */
  imageUrl?: string;
  /** Hex color code for the background when no image is available. */
  color: string;
  /** Optional URL path for deep linking actions. */
  actionUrl?: string;
  /** Flag representing if the banner is currently active. */
  isActive: boolean;
  /** Display sorting order number. */
  order: number;
}

/**
 * A ceremony category shown in the devotee home tab category grid.
 */
export interface CeremonyCategory {
  /** MongoDB ObjectId string. */
  _id: string;
  /** Display name of the ceremony category. */
  name: string;
  /** Flag representing if the category is active. */
  isActive: boolean;
  /** Display sorting order number. */
  order: number;
  /** Expo Ionicons name for the category icon (backend field). */
  icon?: string;
  /** Alias kept for backwards compatibility. */
  iconName?: string;
  /** URL-friendly slug (e.g. "puja", "homam"). */
  slug?: string;
  /** _id of a representative Ceremony in this category, provided by the backend. */
  representativeCeremonyId?: string;
}

/**
 * A priest details card displayed in the nearby priests section.
 */
export interface NearbyPriest {
  /** MongoDB ObjectId string for the priest profile. */
  _id: string;
  /** MongoDB ObjectId string for the user account. */
  userId: string;
  /** Display name of the priest. */
  name: string;
  /** Optional URL of the priest's profile picture. */
  profilePicture?: string;
  /** Primary specialized ceremony or service (e.g. 'Ganesh Puja'). */
  primarySpecialization: string;
  /** Average rating score out of 5 stars. */
  rating: number;
  /** Total number of reviews received. */
  reviewCount: number;
  /** Starting price across all offered services. */
  startingPrice: number;
  /** Total years of professional priesthood experience. */
  experienceYears: number;
  /** Optional computed distance in kilometers from the user. */
  distance?: number;
  /** True when the priest's current availability status is 'offline'. Still bookable for scheduled ceremonies. */
  isOffline?: boolean;
}

/**
 * A festival entry retrieved from the metadata festivals endpoint.
 */
export interface Festival {
  /** Unique identifier for the festival entry. */
  id: string;
  /** Date representation string in 'YYYY-MM-DD' format. */
  date: string;
  /** Display name of the festival. */
  name: string;
  /** Brief descriptive text about the festival. */
  description: string;
}

/**
 * A parsed festival entry enriched with Date object and formatting.
 */
export type FestivalParsed = Festival & {
  /** Parsed JavaScript Date object adjusted to midnight IST. */
  parsedDate: Date;
  /** Two-digit string representation of the day of the month (e.g., '15'). */
  dayNumber: string;
  /** Three-letter uppercase short month string (e.g., 'MAY'). */
  monthShort: string;
};

/**
 * Coordinates coordinate structure.
 */
export interface Coordinates {
  /** Geographic latitude. */
  latitude: number;
  /** Geographic longitude. */
  longitude: number;
}

/**
 * Device location state stored in Redux.
 */
export interface UserLocation {
  /** Optional latitude and longitude coordinates. */
  coordinates: Coordinates | null;
  /** Optional city name retrieved via reverse geocoding. */
  cityName: string | null;
  /** Status of location permission. */
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  /** Timestamp indicating when the location was last fetched. */
  lastFetched: number | null;
}

