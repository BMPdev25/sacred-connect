import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ChipSelector from '@/components/priest/onboarding/ChipSelector';
import { ExperienceStepper, ProfileCard } from '@/components/priest/onboarding/steps/Step1.subcomponents';
import {
  BIO_MAX_LENGTH,
  BIO_MIN_LENGTH,
  EXPERIENCE_MAX,
  EXPERIENCE_MIN,
  LANGUAGE_OPTIONS,
} from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { useStepperLogic } from '@/hooks/useStepperLogic';
import { updateStep1Data } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns character counter color based on current length vs. max. */
function getCounterColor(length: number, max: number): string {
  if (length >= max) return THEME.colors.error;
  if (length >= max - 100) return THEME.colors.primary;
  return THEME.colors.textMuted;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Step 1 of the priest onboarding wizard.
 * Displays a read-only profile card from the user session, then collects
 * languages spoken, years of experience, and a short biography.
 * Reads from and dispatches to Redux onboarding slice.
 */
export const Step1BasicInfo = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const step1 = useSelector((state: RootState) => state.onboarding.step1);
  const user = useSelector((state: RootState) => state.user);

  const stepper = useStepperLogic(
    EXPERIENCE_MIN,
    EXPERIENCE_MAX,
    step1.experienceYears || EXPERIENCE_MIN,
    (newValue) => {
      dispatch(updateStep1Data({ experienceYears: newValue }));
    }
  );

  const [bioFocused, setBioFocused] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function handleLanguageToggle(lang: string): void {
    const current = step1.languages;
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    dispatch(updateStep1Data({ languages: next }));
  }

  function handleBioChange(text: string): void {
    dispatch(updateStep1Data({ bio: text }));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (step1.languages.length < 1) errs.push('Select at least one language');
      if (stepper.value < EXPERIENCE_MIN) errs.push('Enter years of experience');
      if ((step1.bio || '').length < BIO_MIN_LENGTH) errs.push('Bio must be at least 50 characters');
      setErrors(errs);
      return errs.length === 0;
    },
  }));

  const bioLength = (step1.bio || '').length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Section 1 — Profile Display Card (read-only) */}
      <ProfileCard name={user.name} email={user.email} phone={user.phone} />

      {/* Section 2 — Languages Spoken */}
      <Text style={styles.sectionHeading}>Languages Spoken</Text>
      <ChipSelector
        options={LANGUAGE_OPTIONS}
        selected={step1.languages}
        onToggle={handleLanguageToggle}
      />

      {/* Section 3 — Experience */}
      <Text style={styles.sectionHeading}>Experience</Text>
      <ExperienceStepper
        value={stepper.value}
        onIncrement={stepper.increment}
        onDecrement={stepper.decrement}
        isAtMin={stepper.isAtMin}
        isAtMax={stepper.isAtMax}
      />

      {/* Section 4 — Short Biography */}
      <View>
        <Text style={styles.sectionHeading}>Short Biography</Text>
        <TextInput
          style={[styles.bioInput, bioFocused && styles.bioInputFocused]}
          value={step1.bio}
          onChangeText={handleBioChange}
          placeholder="Tell devotees about your spiritual journey..."
          placeholderTextColor={THEME.colors.textMuted}
          maxLength={BIO_MAX_LENGTH}
          multiline
          textAlignVertical="top"
          onFocus={() => setBioFocused(true)}
          onBlur={() => setBioFocused(false)}
        />
        <Text style={[styles.charCounter, { color: getCounterColor(bioLength, BIO_MAX_LENGTH) }]}>
          {bioLength}/{BIO_MAX_LENGTH}
        </Text>
      </View>

      {/* Validation errors */}
      {errors.map((err) => (
        <Text key={err} style={styles.errorText}>{err}</Text>
      ))}
    </ScrollView>
  );
});

Step1BasicInfo.displayName = 'Step1BasicInfo';

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
  bioInput: {
    minHeight: 120,
    maxHeight: 200,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surface,
    textAlignVertical: 'top',
    marginTop: THEME.spacing.sm,
  },
  bioInputFocused: {
    borderColor: THEME.colors.borderActive,
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: THEME.typography.caption,
    marginTop: THEME.spacing.xs,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
});
