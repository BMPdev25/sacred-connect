/**
 * Represents the schedule for a single day.
 */
export interface DaySchedule {
  /** Indicates whether the priest is available on this day. */
  isAvailable: boolean;
  /** Start time of availability in "HH:MM" format. */
  startTime: string;
  /** End time of availability in "HH:MM" format. */
  endTime: string;
}

/**
 * Represents the weekly availability schedule of a priest.
 */
export interface WeeklySchedule {
  /** Monday schedule details. */
  monday: DaySchedule;
  /** Tuesday schedule details. */
  tuesday: DaySchedule;
  /** Wednesday schedule details. */
  wednesday: DaySchedule;
  /** Thursday schedule details. */
  thursday: DaySchedule;
  /** Friday schedule details. */
  friday: DaySchedule;
  /** Saturday schedule details. */
  saturday: DaySchedule;
  /** Sunday schedule details. */
  sunday: DaySchedule;
}

/**
 * Represents a service offered by a priest.
 */
export interface PriestService {
  /** Unique identifier for the ceremony. */
  ceremonyId: string;
  /** Name of the ceremony (display only, not sent to the backend). */
  ceremonyName: string;
  /** Duration of the ceremony in minutes. */
  durationMinutes: number;
  /** Booking price for the ceremony in INR. */
  price: number;
}

/**
 * Represents a document upload slot for onboarding verification.
 */
export interface DocumentSlot {
  /** The category or type of the document. */
  type: 'profile_photo' | 'government_id' | 'religious_certificate' | 'other';
  /** Display label for the document slot. */
  label: string;
  /** Optional description explaining what document is required. */
  description?: string;
  /** Indicates if this document is strictly required. */
  isRequired: boolean;
  /** Indicates if this document is optional. */
  isOptional: boolean;
  /** Current upload status of the document. */
  status: 'empty' | 'uploading' | 'uploaded' | 'error';
  /** Name of the uploaded file. */
  fileName?: string;
  /** URL link to the uploaded document on the server/S3. */
  url?: string;
  /** Optional upload progress percentage (0-100). */
  uploadProgress?: number;
  /** Optional flag indicating optional state overrides (if applicable). */
  isOptionalFlag?: boolean;
}

/**
 * Complete state representation for the priest onboarding wizard flow.
 */
export interface OnboardingState {
  /** The current active step in the wizard (1-6). */
  currentStep: number;
  /** Indicates whether the onboarding process has been fully completed. */
  isCompleted: boolean;
  /** Step 1: Basic profile and bio information. */
  step1: {
    /** List of languages spoken by the priest. */
    languages: string[];
    /** Years of experience practicing priesthood. */
    experienceYears: number;
    /** Short professional or spiritual bio. */
    bio: string;
  };
  /** Step 2: Religious traditions and custom specializations. */
  step2: {
    /** Religious traditions observed/taught (e.g. Shaivism, Vaishnavism). */
    religiousTraditions: string[];
    /** Specializations or specific ritual focuses. */
    specializations: string[];
  };
  /** Step 3: List of services offered and pricing. */
  step3: {
    /** Services offered by the priest. */
    services: PriestService[];
  };
  /** Step 4: Geographic operation details. */
  step4: {
    /** Coordinates of the priest's primary operating location. */
    location: {
      /** Latitude coordinate. */
      latitude: number;
      /** Longitude coordinate. */
      longitude: number;
    };
    /** Maximum radius in kilometers they are willing to travel for services. */
    serviceRadiusKm: number;
  };
  /** Step 5: Regular weekly availability schedule. */
  step5: {
    /** Weekly availability details. */
    weeklySchedule: WeeklySchedule;
  };
  /** Step 6: Onboarding verification documents. */
  step6: {
    /** List of document slots and upload states. */
    documents: DocumentSlot[];
  };
}
