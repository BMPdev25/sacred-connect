/**
 * Payload fields for updating a user's basic profile details.
 */
export interface ProfileUpdatePayload {
  /** Full name of the user */
  name?: string;
  /** Primary contact phone number */
  phone?: string;
}

/**
 * Toggles for various email and push notification preferences.
 */
export interface NotificationPreferences {
  /** Receive updates when a booking is confirmed */
  bookingConfirmations: boolean;
  /** Receive notifications about upcoming ceremonies and bookings */
  upcomingReminders: boolean;
  /** Receive notifications when a booking is cancelled */
  cancellationAlerts: boolean;
  /** Receive promotional festival offers and packages */
  festivalOffers: boolean;
  /** Receive announcements about new application features */
  newFeatures: boolean;
}

/**
 * Structure of a single static FAQ question and answer entry.
 */
export interface FAQItem {
  /** Unique FAQ item identifier */
  id: string;
  /** Question text */
  question: string;
  /** Detailed answer explanation text */
  answer: string;
}
