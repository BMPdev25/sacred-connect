import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import FloatingInput from '@/components/shared/FloatingInput';
import ChipSelector from '@/components/priest/onboarding/ChipSelector';
import { ExperienceStepper } from '@/components/priest/onboarding/steps/Step1.subcomponents';
import { useStepperLogic } from '@/hooks/useStepperLogic';
import {
  BIO_MAX_LENGTH,
  EXPERIENCE_MAX,
  EXPERIENCE_MIN,
  LANGUAGE_OPTIONS,
} from '@/constants/onboarding';

interface EditPriestProfileFormProps {
  name: string;
  setName: (text: string) => void;
  phone: string;
  setPhone: (text: string) => void;
  email: string;
  bio: string;
  setBio: (text: string) => void;
  experienceYears: number;
  setExperienceYears: (val: number) => void;
  selectedLanguages: string[];
  onLanguageToggle: (lang: string) => void;
}

/**
 * Subcomponent rendering the edit fields for the priest profile.
 * Extracted from EditPriestProfile.tsx to satisfy the 200-line component file limit.
 */
export function EditPriestProfileForm({
  name,
  setName,
  phone,
  setPhone,
  email,
  bio,
  setBio,
  experienceYears,
  setExperienceYears,
  selectedLanguages,
  onLanguageToggle,
}: EditPriestProfileFormProps): React.JSX.Element {
  const [bioFocused, setBioFocused] = useState(false);

  const stepper = useStepperLogic(
    EXPERIENCE_MIN,
    EXPERIENCE_MAX,
    experienceYears,
    setExperienceYears
  );

  const verifiedIcon = (
    <View style={styles.verifiedContainer}>
      <Ionicons name="lock-closed" size={14} color="#16A34A" style={styles.lockIcon} />
      <Text style={styles.verifiedText}>Verified</Text>
    </View>
  );

  const bioLength = bio.length;
  const counterColor = bioLength >= BIO_MAX_LENGTH ? THEME.colors.error : THEME.colors.textMuted;

  return (
    <View style={styles.formCard}>
      {/* Basic Info */}
      <Text style={styles.sectionHeading}>Basic Info</Text>

      <FloatingInput
        label="Full Name"
        value={name}
        onChangeText={setName}
        leftIcon={<Ionicons name="person-outline" size={20} color={THEME.colors.textMuted} />}
        isValid={name.trim().length >= 2}
        editable={true}
      />

      <View style={styles.divider} />

      <FloatingInput
        label="Email"
        value={email}
        onChangeText={() => {}}
        editable={false}
        leftIcon={<Ionicons name="mail-outline" size={20} color={THEME.colors.textMuted} />}
        rightIcon={verifiedIcon}
      />

      <View style={styles.divider} />

      <FloatingInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        leftIcon={<Ionicons name="phone-portrait-outline" size={20} color={THEME.colors.textMuted} />}
        keyboardType="phone-pad"
        isValid={phone.length >= 10}
        editable={true}
      />

      {/* About You */}
      <Text style={styles.sectionHeading}>About You</Text>
      <View style={styles.bioContainer}>
        <Text style={styles.bioLabel}>About / Bio</Text>
        <TextInput
          style={[styles.bioInput, bioFocused && styles.bioInputFocused]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell devotees about your spiritual journey..."
          placeholderTextColor={THEME.colors.textMuted}
          maxLength={BIO_MAX_LENGTH}
          multiline
          textAlignVertical="top"
          onFocus={() => setBioFocused(true)}
          onBlur={() => setBioFocused(false)}
        />
        <Text style={[styles.charCounter, { color: counterColor }]}>
          {bioLength}/{BIO_MAX_LENGTH}
        </Text>
      </View>

      {/* Experience */}
      <Text style={styles.sectionHeading}>Experience</Text>
      <View style={styles.stepperContainer}>
        <ExperienceStepper
          value={stepper.value}
          onIncrement={stepper.increment}
          onDecrement={stepper.decrement}
          isAtMin={stepper.isAtMin}
          isAtMax={stepper.isAtMax}
        />
      </View>

      {/* Languages */}
      <Text style={styles.sectionHeading}>Languages</Text>
      <View style={styles.languagesContainer}>
        <ChipSelector
          options={LANGUAGE_OPTIONS}
          selected={selectedLanguages}
          onToggle={onLanguageToggle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  sectionHeading: {
    fontSize: THEME.typography.caption,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.sm,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: THEME.spacing.xs,
  },
  verifiedText: {
    color: '#16A34A',
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
  },
  bioContainer: {
    marginTop: THEME.spacing.xs,
  },
  bioLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  bioInput: {
    minHeight: 100,
    maxHeight: 180,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.background,
    textAlignVertical: 'top',
  },
  bioInputFocused: {
    borderColor: THEME.colors.borderActive,
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: THEME.typography.caption,
    marginTop: THEME.spacing.xs,
  },
  stepperContainer: {
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  languagesContainer: {
    marginTop: THEME.spacing.xs,
  },
});
