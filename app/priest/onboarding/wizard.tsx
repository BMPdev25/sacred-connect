import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WizardHeader from '@/components/priest/onboarding/WizardHeader';
import { Step1BasicInfo, StepRef } from '@/components/priest/onboarding/Step1BasicInfo';
import { Step2Traditions } from '@/components/priest/onboarding/Step2Traditions';
import { Step3Services } from '@/components/priest/onboarding/Step3Services';
import { Step4ServiceArea } from '@/components/priest/onboarding/Step4ServiceArea';
import { Step5Availability } from '@/components/priest/onboarding/Step5Availability';
import { Step6Documents } from '@/components/priest/onboarding/Step6Documents';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { setCurrentStep } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import {
  loadOnboardingProgress,
  saveStepData,
  submitForReview,
} from '@/services/priest/onboardingService';
import { OnboardingState } from '@/types/priest.types';

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
  const currentStep = useSelector((state: RootState) => state.onboarding.currentStep);
  const onboardingState = useSelector((state: RootState) => state.onboarding);

  useEffect(() => {
    async function initOnboardingProgress() {
      try {
        const progress = await loadOnboardingProgress();
        if (progress.currentStep > 1) {
          dispatch(setCurrentStep(progress.currentStep));
        }
      } catch (error) {
        console.error('Failed to initialize onboarding data:', error);
      }
    }
    initOnboardingProgress();
  }, [dispatch]);

  /**
   * Handles forward wizard navigation, validating the active step before
   * saving data to the backend database.
   */
  const handleContinue = async (): Promise<void> => {
    if (stepRef.current && !stepRef.current.validate()) {
      return;
    }

    setLoading(true);
    try {
      const stepKey = `step${currentStep}` as keyof OnboardingState;
      const stepData = onboardingState[stepKey] || {};
      
      await saveStepData(currentStep, stepData as Record<string, unknown>);

      if (currentStep < 6) {
        dispatch(setCurrentStep(currentStep + 1));
      } else if (currentStep === 6) {
        await submitForReview();
        router.replace('/priest/onboarding/verification-status' as any);
      }
    } catch (error) {
      console.error('Navigation step saving failed:', error);
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
});
