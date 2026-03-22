import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

interface OnboardingState {
  currentStep: number;
  formData: {
    // Step 1: Basic Info
    name: string;
    email?: string;
    password?: string;
    whatsappNumber: string;
    experienceYears: string;
    bio: string;
    // Step 2: Region & Tradition
    address: string;
    languages: string[];
    sampradaya: string;
    // Step 3: Rituals
    selectedCeremonies: string[];
    // Step 4: Documents (URIs/Paths)
    profilePhoto?: string;
    aadhaarCard?: string;
    certificate?: string;
  };
  isSubmitting: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  currentStep: 0,
  formData: {
    name: '',
    email: '',
    password: '',
    whatsappNumber: '',
    experienceYears: '',
    bio: '',
    address: '',
    languages: [],
    sampradaya: '',
    selectedCeremonies: [],
  },
  isSubmitting: false,
  error: null,
};

const ONBOARDING_STORAGE_KEY = 'priest_onboarding_draft';

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      saveDraft(state);
    },
    updateFormData: (state, action: PayloadAction<Partial<OnboardingState['formData']>>) => {
      state.formData = { ...state.formData, ...action.payload };
      saveDraft(state);
    },
    resetOnboarding: (state) => {
      Object.assign(state, initialState);
      SecureStore.deleteItemAsync(ONBOARDING_STORAGE_KEY);
    },
    loadDraft: (state, action: PayloadAction<Partial<OnboardingState>>) => {
      if (action.payload.formData) {
        state.formData = { ...state.formData, ...action.payload.formData };
      }
      if (action.payload.currentStep !== undefined) {
        state.currentStep = action.payload.currentStep;
      }
    }
  },
});

// Helper to save draft to SecureStore
async function saveDraft(state: OnboardingState) {
  try {
    const data = JSON.stringify({
      currentStep: state.currentStep,
      formData: state.formData
    });
    // SecureStore has a 2048 byte limit. If it's larger, we might need FileSystem.
    // For onboarding data, it should fit unless the bio is massive.
    if (data.length < 2000) {
      await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, data);
    }
  } catch (e) {
    console.warn('Failed to save onboarding draft:', e);
  }
}

export const { setStep, updateFormData, resetOnboarding, loadDraft } = onboardingSlice.actions;
export default onboardingSlice.reducer;
