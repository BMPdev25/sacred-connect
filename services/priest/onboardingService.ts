import api from '@/api/index';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import {
  setCurrentStep,
  setOnboardingCompleted,
  hydrateFromProfile,
  updateStep1Data,
  updateStep2Data,
  updateStep3Services,
  updateStep4Location,
  updateStep5Schedule,
  updateStep6Document,
} from '@/redux/slices/onboardingSlice';
import { store } from '@/redux/store';
import {
  DaySchedule,
  DocumentSlot,
  OnboardingState,
  PriestService,
  WeeklySchedule,
} from '@/types/priest.types';

// ---------------------------------------------------------------------------
// Helper functions (Internal only)
// ---------------------------------------------------------------------------

/**
 * Helper to get document label from type.
 */
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

/**
 * Helper to get document description from type.
 */
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
 * Maps the raw backend profile API response to the frontend OnboardingState shape.
 *
 * @param profile - Raw profile data from backend.
 * @returns Mapped OnboardingState object.
 */
function mapProfileToOnboardingState(profile: Record<string, any>): OnboardingState {
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

  const currentStep = profile.onboardingCurrentStep || 1;
  const isCompleted = profile.onboardingCompleted || false;

  // Step 1
  const step1 = {
    languages: profile.languages || [],
    experienceYears: profile.experience || 0,
    bio: profile.description || '',
  };

  // Step 2
  const religiousTraditions = profile.religiousTraditions 
    ? profile.religiousTraditions 
    : (profile.religiousTradition ? [profile.religiousTradition] : []);

  const specializations = profile.specializations?.map((s: any) => {
    if (typeof s === 'string') return s;
    return s.name || '';
  }) || [];

  const step2 = {
    religiousTraditions,
    specializations,
  };

  // Step 3
  const services: PriestService[] = profile.services?.map((s: any) => {
    const ceremonyId = typeof s.ceremonyId === 'object' && s.ceremonyId !== null
      ? s.ceremonyId._id
      : s.ceremonyId || '';
    const ceremonyName = typeof s.ceremonyId === 'object' && s.ceremonyId !== null
      ? s.ceremonyId.name || s.ceremonyName || ''
      : s.ceremonyName || '';
    return {
      ceremonyId,
      ceremonyName,
      durationMinutes: s.durationMinutes || 0,
      price: s.price || 0,
    };
  }) || [];

  const step3 = { services };

  // Step 4
  const lat = profile.location?.latitude ?? profile.location?.coordinates?.[1] ?? 0;
  const lng = profile.location?.longitude ?? profile.location?.coordinates?.[0] ?? 0;
  const step4 = {
    location: { latitude: lat, longitude: lng },
    serviceRadiusKm: profile.serviceRadiusKm ?? 10,
  };

  // Step 5
  const weeklySchedule = { ...defaultWeeklySchedule };
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
      const scheduleVal = ws[day];
      if (scheduleVal) {
        if (typeof scheduleVal === 'object' && 'isAvailable' in scheduleVal) {
          weeklySchedule[day] = {
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
          weeklySchedule[day] = {
            isAvailable: isAvail,
            startTime: start,
            endTime: end,
          };
        }
      }
    });
  }
  const step5 = { weeklySchedule };

  // Step 6
  const docs = [...defaultDocuments];
  const incomingDocs = profile.verificationDocuments || profile.documents;
  if (incomingDocs && Array.isArray(incomingDocs)) {
    incomingDocs.forEach((doc: any) => {
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
  const step6 = { documents: docs };

  return {
    currentStep,
    isCompleted,
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
  };
}

/**
 * Maps frontend state format to backend priest profile schema payload format.
 *
 * @param step - The wizard step index.
 * @param data - The step data in frontend format.
 * @returns Mapped key-value pairs suitable for the backend API.
 */
function buildStepPayload(step: number, data: Record<string, any>): Record<string, unknown> {
  switch (step) {
    case 1:
      return {
        experience: data.experienceYears,
        description: data.bio,
        languages: data.languages,
      };
    case 2:
      return {
        religiousTradition: data.religiousTraditions?.[0] || '',
        specializations: data.specializations?.map((spec: any) =>
          typeof spec === 'string' ? { name: spec, experience: 0 } : spec
        ) || [],
      };
    case 3:
      return {
        services: (data.services || [])
          .filter((svc: any) => svc.ceremonyId && svc.ceremonyId.trim() !== '')
          .map((svc: any) => ({
            ceremonyId: svc.ceremonyId,
            price: svc.price,
            durationMinutes: svc.durationMinutes,
          })),
      };
    case 4:
      return {
        location: {
          type: 'Point',
          coordinates: [data.location?.longitude || 0, data.location?.latitude || 0],
        },
        serviceRadiusKm: data.serviceRadiusKm || 10,
      };
    case 5: {
      const backendWeeklySchedule: Record<string, string[]> = {};
      const ws = data.weeklySchedule as WeeklySchedule;
      if (ws) {
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
          const scheduleVal = ws[day];
          if (scheduleVal && scheduleVal.isAvailable) {
            backendWeeklySchedule[day] = [`${scheduleVal.startTime}-${scheduleVal.endTime}`];
          } else {
            backendWeeklySchedule[day] = [];
          }
        });
      }
      return {
        availability: {
          weeklySchedule: backendWeeklySchedule,
        },
      };
    }
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Exported Services
// ---------------------------------------------------------------------------

/**
 * Loads current priest onboarding progress from backend.
 *
 * @returns Resolves to parsed OnboardingState on success.
 */
export async function loadOnboardingProgress(): Promise<OnboardingState> {
  try {
    const response = await api.get('/priest/profile');
    const mappedState = mapProfileToOnboardingState(response.data);
    store.dispatch(hydrateFromProfile(response.data));
    return mappedState;
  } catch (error) {
    console.error('Failed to load onboarding progress:', error);
    throw new Error(getReadableErrorMessage(error));
  }
}

/**
 * Saves a single step's onboarding data to the backend.
 * Merges step-specific payload fields and updates backend current step counters.
 *
 * @param step - Current wizard step (1-6).
 * @param data - The step data to save.
 */
export async function saveStepData(step: number, data: Record<string, unknown>): Promise<void> {
  try {
    const payload = {
      ...buildStepPayload(step, data),
      onboardingCurrentStep: step + 1,
    };
    await api.put('/priest/profile', payload);

    if (step === 1 && typeof data.name === 'string' && data.name.trim()) {
      await api.put('/users/profile', { name: data.name.trim() });
    }

    // Dispatch appropriate actions based on step
    if (step === 1) {
      store.dispatch(updateStep1Data(data as any));
    } else if (step === 2) {
      store.dispatch(updateStep2Data(data as any));
    } else if (step === 3) {
      store.dispatch(updateStep3Services(data.services as any));
    } else if (step === 4) {
      store.dispatch(
        updateStep4Location({
          location: data.location as any,
          serviceRadiusKm: data.serviceRadiusKm as any,
        })
      );
    } else if (step === 5) {
      store.dispatch(updateStep5Schedule(data.weeklySchedule as any));
    }
  } catch (error) {
    console.error(`Failed to save step ${step} data:`, error);
    throw new Error(getReadableErrorMessage(error));
  }
}

/**
 * Uploads a verification document file to the backend server.
 *
 * @param docType - The category or target slot of the document.
 * @param file - React Native document descriptor containing local URI, filename, and type.
 * @returns Resolves to the saved document's S3/Cloudinary URL on success.
 */
export async function uploadDocument(
  docType: DocumentSlot['type'],
  file: { uri: string; name: string; type: string }
): Promise<string> {
  try {
    const backendDocType = docType === 'profile_photo' ? 'profile_picture' : docType;
    const formData = new FormData();
    formData.append('document', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    formData.append('documentType', backendDocType);

    const response = await api.post('/priest/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const url = response.data.url || `${api.defaults.baseURL}/priest/documents/${backendDocType}`;

    store.dispatch(
      updateStep6Document({
        type: docType,
        updates: {
          status: 'uploaded',
          url,
          fileName: file.name,
        },
      })
    );

    return url;
  } catch (error) {
    store.dispatch(
      updateStep6Document({
        type: docType,
        updates: {
          status: 'error',
        },
      })
    );
    console.error(`Failed to upload document for ${docType}:`, error);
    throw new Error(getReadableErrorMessage(error));
  }
}

/**
 * Finalizes the onboarding wizard, submitting details for admin verification review.
 */
export async function submitForReview(): Promise<void> {
  try {
    await api.post('/priest/submit-verification');
    store.dispatch(setCurrentStep(7));
    store.dispatch(setOnboardingCompleted(true));
  } catch (error) {
    console.error('Failed to submit onboarding profile for review:', error);
    throw new Error(getReadableErrorMessage(error));
  }
}

/**
 * Service package containing all priest onboarding API endpoints.
 */
export const OnboardingService = {
  loadOnboardingProgress,
  saveStepData,
  uploadDocument,
  submitForReview,
};
