import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ChipSelector from '@/components/priest/onboarding/ChipSelector';
import { SPECIALIZATION_OPTIONS, TRADITION_OPTIONS } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { updateStep2Data } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Toggles a string value in an array: removes it if present, adds it if not.
 */
function toggleSelection(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Step 2 of the priest onboarding wizard.
 * Collects the priest's religious tradition affiliations and ceremony specializations.
 * Reads from and dispatches to Redux onboarding slice.
 */
export const Step2Traditions = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const step2 = useSelector((state: RootState) => state.onboarding.step2);
  const [errors, setErrors] = useState<string[]>([]);

  function handleTraditionToggle(value: string): void {
    const next = toggleSelection(step2.religiousTraditions, value);
    dispatch(updateStep2Data({ religiousTraditions: next }));
  }

  function handleSpecializationToggle(value: string): void {
    const next = toggleSelection(step2.specializations, value);
    dispatch(updateStep2Data({ specializations: next }));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (step2.religiousTraditions.length < 1) {
        errs.push('Select at least one religious tradition');
      }
      if (step2.specializations.length < 1) {
        errs.push('Select at least one ceremony specialization');
      }
      setErrors(errs);
      return errs.length === 0;
    },
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Religious Tradition Section */}
      <Text style={styles.sectionHeading}>Religious Tradition</Text>
      <ChipSelector
        options={TRADITION_OPTIONS}
        selected={step2.religiousTraditions}
        onToggle={handleTraditionToggle}
      />

      {/* Ceremony Specializations Section */}
      <Text style={styles.sectionHeading}>Ceremony Specializations</Text>
      <ChipSelector
        options={SPECIALIZATION_OPTIONS}
        selected={step2.specializations}
        onToggle={handleSpecializationToggle}
      />

      {/* Validation errors */}
      {errors.map((err) => (
        <Text key={err} style={styles.errorText}>{err}</Text>
      ))}
    </ScrollView>
  );
});

Step2Traditions.displayName = 'Step2Traditions';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  sectionHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.maroon,
    marginTop: THEME.spacing.xs,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
});
