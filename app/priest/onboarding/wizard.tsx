import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WizardHeader from '@/components/priest/onboarding/WizardHeader';
import { Step1BasicInfo, StepRef } from '@/components/priest/onboarding/Step1BasicInfo';
import { Step2Traditions } from '@/components/priest/onboarding/Step2Traditions';
import { Step3Services } from '@/components/priest/onboarding/Step3Services';
import { Step4ServiceArea } from '@/components/priest/onboarding/Step4ServiceArea';
import { Step5Availability } from '@/components/priest/onboarding/Step5Availability';
import { Step6Documents } from '@/components/priest/onboarding/Step6Documents';
import { DOCUMENT_SLOTS, validateStep6Documents } from '@/components/priest/onboarding/steps/Step6.subcomponents';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { setCurrentStep } from '@/redux/slices/onboardingSlice';
import { RootState, store } from '@/redux/store';
import {
  loadOnboardingProgress,
  saveStepData,
  submitForReview,
} from '@/services/priest/onboardingService';
import { OnboardingState } from '@/types/priest.types';
import { hasPriestCompletedOnboarding, isPriestVerified } from '@/utils/priestUtils';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PriestOnboardingWizard is the shell page that orchestrates the multi-step wizard.
 * Renders the WizardHeader, active step components, and next/submit CTAs.
 */
export default function PriestOnboardingWizard(): React.JSX.Element {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const stepRef = useRef<StepRef>(null);
  
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const currentStep = useSelector((state: RootState) => state.onboarding.currentStep);
  const step6Documents = useSelector((state: RootState) => state.onboarding.step6.documents);
  const priestState = useSelector((state: RootState) => state.onboarding);
  const userPriestState = useSelector((state: RootState) => state.user.priestState);

  async function initOnboardingProgress() {
    setLoading(true);
    setInitError(null);
    try {
      const progress = await loadOnboardingProgress();
      if (progress.currentStep > 1) {
        dispatch(setCurrentStep(progress.currentStep));
      }
    } catch (error: any) {
      console.error('Failed to initialize onboarding data:', error);
      setInitError(error.message || 'Failed to load onboarding progress.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Safety check: if priest has already submitted, 
    // do not show wizard
    const alreadySubmitted = hasPriestCompletedOnboarding(
      priestState.isCompleted,
      userPriestState?.verificationStatus
    );
    
    if (alreadySubmitted) {
      // Priest should not be here — redirect immediately
      if (isPriestVerified(userPriestState?.verificationStatus)) {
        router.replace('/priest');
      } else {
        router.replace('/priest/onboarding/verification-status');
      }
      return; // Do not proceed with wizard initialization
    }
    
    initOnboardingProgress();
  }, [dispatch]);

  /**
   * Handles forward wizard navigation, validating the active step before
   * saving data to the backend database.
   * Uses an optimistic Redux update (steps 1–5) so the UI advances immediately,
   * with a rollback if the API call fails.
   */
  const handleContinue = async (): Promise<void> => {
    if (stepRef.current && !stepRef.current.validate()) {
      return;
    }

    const previousStep = currentStep; // save for rollback
    setLoading(true);

    // Optimistic advance for steps 1–5 so the UI doesn't feel stuck
    if (currentStep < 6) {
      dispatch(setCurrentStep(currentStep + 1));
    }

    try {
      const state = store.getState();
      const stepKey = `step${currentStep}` as keyof OnboardingState;
      const stepData = state.onboarding[stepKey] || {};

      await saveStepData(currentStep, stepData as Record<string, unknown>);

      if (currentStep === 6) {
        await submitForReview();
        router.replace('/priest/onboarding/verification-status' as any);
      }
    } catch (error: any) {
      // Rollback the optimistic step advance so the user can retry from the correct step
      dispatch(setCurrentStep(previousStep));
      console.error('Navigation step saving failed:', error);
      Alert.alert('Save Failed', error.message || 'Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles backward wizard navigation, decrementing step counters locally.
   */
  const handleBack = (): void => {
    if (currentStep === 1) return;
    dispatch(setCurrentStep(currentStep - 1));
  };

  /**
   * Render the corresponding sub-component for the current step.
   */
  const renderStepComponent = (): React.ReactElement => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo ref={stepRef} />;
      case 2:
        return <Step2Traditions ref={stepRef} />;
      case 3:
        return <Step3Services ref={stepRef} />;
      case 4:
        return <Step4ServiceArea ref={stepRef} />;
      case 5:
        return <Step5Availability ref={stepRef} />;
      case 6:
        return <Step6Documents ref={stepRef} />;
      default:
        return <Step1BasicInfo ref={stepRef} />;
    }
  };

  let isSubmitDisabled = false;
  if (currentStep === 6) {
    const slots = DOCUMENT_SLOTS.map((slot) => {
      const uploaded = step6Documents.find((d) => d.type === slot.type);
      return uploaded ? { ...slot, ...uploaded } : slot;
    });
    const step6Errors = validateStep6Documents(slots);
    isSubmitDisabled = step6Errors.length > 0;
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.error} />
        <Text style={styles.errorTitle}>Failed to Load Onboarding</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <View style={styles.retryBtnWrap}>
          <PrimaryButton
            title="Retry"
            onPress={initOnboardingProgress}
            loading={loading}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WizardHeader
        currentStep={currentStep}
        totalSteps={6}
        onBack={handleBack}
        isBackDisabled={currentStep === 1}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepComponent()}
      </ScrollView>

      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + THEME.spacing.md }]}>
        <PrimaryButton
          title={currentStep === 6 ? 'Submit for Review' : 'Save & Continue'}
          onPress={handleContinue}
          loading={loading}
          disabled={isSubmitDisabled}
          variant="primary"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
  },
  ctaContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  errorTitle: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  retryBtnWrap: {
    width: '100%',
    paddingHorizontal: THEME.spacing.xl,
  },
});
