import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  DaySchedule,
  DocumentSlot,
  OnboardingState,
  PriestService,
  WeeklySchedule,
} from '@/types/priest.types';

// Helper functions for DocumentSlot labels and descriptions
function getDocumentLabel(type: DocumentSlot['type']): string {
  switch (type) {
    case 'profile_photo':
      return 'Profile Photo';
    case 'government_id':
      return 'Government ID';
    case 'religious_certificate':
      return 'Religious Certificate';
    default:
      return 'Other Document';
  }
}

function getDocumentDescription(type: DocumentSlot['type']): string {
  switch (type) {
    case 'profile_photo':
      return 'Upload a clear passport size photograph';
    case 'government_id':
      return 'Aadhaar Card, PAN Card, or Passport';
    case 'religious_certificate':
      return 'Certificate or proof of priesthood training/experience';
    default:
      return 'Any other supporting documents';
  }
}

/**
 * Shape of the priest profile data returned from the backend API,
 * used to hydrate the onboarding state.
 */
export interface PriestProfileHydrationData {
  /** Optional current onboarding step. */
  onboardingCurrentStep?: number;
  /** Optional onboarding completion flag. */
  onboardingCompleted?: boolean;
  /** List of languages spoken by the priest. */
  languages?: string[];
  /** Years of experience. */
  experience?: number;
  /** Priest's bio description. */
  description?: string;
  /** Religious traditions (e.g. Shaivism). */
  religiousTraditions?: string[];
  /** Fallback religious tradition string. */
  religiousTradition?: string;
  /** Specialization details. */
  specializations?: Array<{ name: string } | string>;
  /** Offered services. */
  services?: Array<{
    ceremonyId: { _id: string; name?: string } | string;
    price: number;
    durationMinutes: number;
    ceremonyName?: string;
  }>;
  /** Geographic location coordinates. */
  location?: {
    type?: string;
    coordinates?: [number, number]; // [longitude, latitude]
    latitude?: number;
    longitude?: number;
  };
  /** Operating radius in kilometers. */
  serviceRadiusKm?: number;
  /** Regular availability schedules. */
  availability?: {
    weeklySchedule?: Record<string, string[] | undefined> | WeeklySchedule;
  };
  /** Verification documents list. */
  verificationDocuments?: Array<{
    type: DocumentSlot['type'];
    status: string;
    fileName?: string;
    data?: string;
    url?: string;
  }>;
  /** Fallback documents list. */
  documents?: Array<{
    type: DocumentSlot['type'];
    status: string;
    fileName?: string;
    data?: string;
    url?: string;
  }>;
  /** URL of profile picture. */
  profilePicture?: string;
}

const defaultDaySchedule: DaySchedule = {
  isAvailable: false,
  startTime: '09:00',
  endTime: '18:00',
};

const defaultWeeklySchedule: WeeklySchedule = {
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { ...defaultDaySchedule },
  sunday: { ...defaultDaySchedule },
};

const defaultDocuments: DocumentSlot[] = [
  {
    type: 'profile_photo',
    label: 'Profile Photo',
    description: 'Upload a clear passport size photograph',
    isRequired: true,
    isOptional: false,
    status: 'empty',
  },
  {
    type: 'government_id',
    label: 'Government ID',
    description: 'Aadhaar Card, PAN Card, or Passport',
    isRequired: true,
    isOptional: false,
    status: 'empty',
  },
  {
    type: 'religious_certificate',
    label: 'Religious Certificate',
    description: 'Certificate or proof of priesthood training/experience',
    isRequired: true,
    isOptional: false,
    status: 'empty',
  },
];

const initialState: OnboardingState = {
  currentStep: 1,
  isCompleted: false,
  step1: {
    languages: [],
    experienceYears: 0,
    bio: '',
  },
  step2: {
    religiousTraditions: [],
    specializations: [],
  },
  step3: {
    services: [],
  },
  step4: {
    location: { latitude: 0, longitude: 0 },
    serviceRadiusKm: 10,
  },
  step5: {
    weeklySchedule: defaultWeeklySchedule,
  },
  step6: {
    documents: defaultDocuments,
  },
};

/**
 * Redux Toolkit slice for managing the multi-step priest onboarding wizard state.
 * Contains pure actions for updating data at each step, resetting state, and hydrating from API.
 */
export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    /**
     * Sets the current active step in the wizard.
     */
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },

    /**
     * Sets whether the onboarding process has been fully completed.
     */
    setOnboardingCompleted(state, action: PayloadAction<boolean>) {
      state.isCompleted = action.payload;
    },

    /**
     * Merges partial updates into Step 1 data (languages, experience years, bio).
     */
    updateStep1Data(state, action: PayloadAction<Partial<OnboardingState['step1']>>) {
      state.step1 = { ...state.step1, ...action.payload };
    },

    /**
     * Merges partial updates into Step 2 data (religious traditions, specializations).
     */
    updateStep2Data(state, action: PayloadAction<Partial<OnboardingState['step2']>>) {
      state.step2 = { ...state.step2, ...action.payload };
    },

    /**
     * Sets the services offered by the priest (Step 3).
     */
    updateStep3Services(state, action: PayloadAction<PriestService[]>) {
      state.step3.services = action.payload;
    },

    /**
     * Updates the operating location and travel radius (Step 4).
     * Accepts either `radius` or `serviceRadiusKm` for compatibility.
     */
    updateStep4Location(
      state,
      action: PayloadAction<{
        location: OnboardingState['step4']['location'];
        radius?: number;
        serviceRadiusKm?: number;
      }>
    ) {
      state.step4.location = action.payload.location;
      if (action.payload.serviceRadiusKm !== undefined) {
        state.step4.serviceRadiusKm = action.payload.serviceRadiusKm;
      } else if (action.payload.radius !== undefined) {
        state.step4.serviceRadiusKm = action.payload.radius;
      }
    },

    /**
     * Updates the address and coordinates for Step 4 (address-form flow).
     */
    updateStep4Address(
      state,
      action: PayloadAction<{
        address: NonNullable<OnboardingState['step4']['address']>;
        coordinates: { lat: number; lng: number };
      }>
    ) {
      state.step4.address = action.payload.address;
      state.step4.location = {
        latitude: action.payload.coordinates.lat,
        longitude: action.payload.coordinates.lng,
      };
    },

    /**
     * Sets the weekly availability schedule (Step 5).
     */
    updateStep5Schedule(state, action: PayloadAction<WeeklySchedule>) {
      state.step5.weeklySchedule = action.payload;
    },

    /**
     * Merges partial updates into a specific verification document slot (Step 6).
     * Finds the slot by type, or creates a new slot if it doesn't exist.
     */
    updateStep6Document(
      state,
      action: PayloadAction<{
        type: DocumentSlot['type'];
        updates: Partial<DocumentSlot>;
      }>
    ) {
      const { type, updates } = action.payload;
      const index = state.step6.documents.findIndex((doc) => doc.type === type);
      if (index !== -1) {
        state.step6.documents[index] = {
          ...state.step6.documents[index],
          ...updates,
        };
      } else {
        const newSlot: DocumentSlot = {
          type,
          label: updates.label || getDocumentLabel(type),
          description: updates.description || getDocumentDescription(type),
          isRequired: updates.isRequired ?? (type !== 'other'),
          isOptional: updates.isOptional ?? (type === 'other'),
          status: updates.status || 'empty',
          ...updates,
        };
        state.step6.documents.push(newSlot);
      }
    },

    /**
     * Resets the entire onboarding state back to default values.
     */
    resetOnboarding() {
      return initialState;
    },

    /**
     * Hydrates the entire onboarding wizard state from the backend profile response.
     * Resumes incomplete states and converts data formats where needed.
     */
    hydrateFromProfile(state, action: PayloadAction<PriestProfileHydrationData>) {
      const profile = action.payload;
      state.currentStep = profile.onboardingCurrentStep || 1;
      state.isCompleted = profile.onboardingCompleted || false;

      // Step 1
      const isObjectId = (val: string) => /^[a-f\d]{24}$/i.test(val);
      state.step1.languages = (profile.languages || []).filter(
        (lang) => lang && !isObjectId(lang),
      );
      state.step1.experienceYears = profile.experience || 0;
      state.step1.bio = profile.description || '';

      // Step 2
      if (profile.religiousTraditions) {
        state.step2.religiousTraditions = profile.religiousTraditions;
      } else if (profile.religiousTradition) {
        state.step2.religiousTraditions = [profile.religiousTradition];
      } else {
        state.step2.religiousTraditions = [];
      }

      state.step2.specializations = profile.specializations?.map((s) => {
        if (typeof s === 'string') return s;
        return s.name;
      }) || [];

      // Step 3
      state.step3.services = profile.services?.map((s) => {
        let ceremonyId = '';
        let ceremonyName = s.ceremonyName || '';

        if (s.ceremonyId) {
          if (typeof s.ceremonyId === 'string') {
            ceremonyId = s.ceremonyId;
          } else {
            ceremonyId = s.ceremonyId._id;
            if (s.ceremonyId.name) {
              ceremonyName = s.ceremonyId.name;
            }
          }
        }

        return {
          ceremonyId,
          ceremonyName,
          durationMinutes: s.durationMinutes || 0,
          price: s.price || 0,
        };
      }) || [];

      // Step 4
      const lat = profile.location?.latitude ?? profile.location?.coordinates?.[1] ?? 0;
      const lng = profile.location?.longitude ?? profile.location?.coordinates?.[0] ?? 0;
      state.step4.location = { latitude: lat, longitude: lng };
      state.step4.serviceRadiusKm = profile.serviceRadiusKm ?? 10;

      // Step 5
      if (profile.availability?.weeklySchedule) {
        const ws = profile.availability.weeklySchedule;
        const days: (keyof WeeklySchedule)[] = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];
        days.forEach((day) => {
          const scheduleVal = (ws as any)[day];
          if (scheduleVal) {
            if (typeof scheduleVal === 'object' && 'isAvailable' in scheduleVal) {
              state.step5.weeklySchedule[day] = {
                isAvailable: scheduleVal.isAvailable,
                startTime: scheduleVal.startTime || '09:00',
                endTime: scheduleVal.endTime || '18:00',
              };
            } else if (Array.isArray(scheduleVal)) {
              const isAvail = scheduleVal.length > 0;
              let start = '09:00';
              let end = '18:00';
              if (isAvail && typeof scheduleVal[0] === 'string') {
                const parts = scheduleVal[0].split('-');
                if (parts.length === 2) {
                  start = parts[0];
                  end = parts[1];
                }
              }
              state.step5.weeklySchedule[day] = {
                isAvailable: isAvail,
                startTime: start,
                endTime: end,
              };
            }
          }
        });
      }

      // Step 6
      const docs = [...defaultDocuments];
      const incomingDocs = profile.verificationDocuments || profile.documents;
      if (incomingDocs && Array.isArray(incomingDocs)) {
        incomingDocs.forEach((doc) => {
          const docType = doc.type;
          const existingIndex = docs.findIndex((d) => d.type === docType);
          const mappedStatus: DocumentSlot['status'] =
            doc.status === 'verified' || doc.status === 'uploaded' || doc.status === 'pending'
              ? 'uploaded'
              : doc.status === 'rejected'
                ? 'error'
                : 'empty';

          const updatedSlot: DocumentSlot = {
            type: docType,
            label: getDocumentLabel(docType),
            description: getDocumentDescription(docType),
            isRequired: docType !== 'other',
            isOptional: docType === 'other',
            status: mappedStatus,
            fileName: doc.fileName || '',
            url: doc.url || doc.data || '',
          };

          if (existingIndex !== -1) {
            docs[existingIndex] = updatedSlot;
          } else {
            docs.push(updatedSlot);
          }
        });
      }

      if (profile.profilePicture) {
        const photoIndex = docs.findIndex((d) => d.type === 'profile_photo');
        if (photoIndex !== -1 && docs[photoIndex].status === 'empty') {
          docs[photoIndex] = {
            ...docs[photoIndex],
            status: 'uploaded',
            url: profile.profilePicture,
            fileName: 'profile_photo.jpg',
          };
        }
      }
      state.step6.documents = docs;
    },
  },
});

export const {
  setCurrentStep,
  setOnboardingCompleted,
  updateStep1Data,
  updateStep2Data,
  updateStep3Services,
  updateStep4Location,
  updateStep4Address,
  updateStep5Schedule,
  updateStep6Document,
  resetOnboarding,
  hydrateFromProfile,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
