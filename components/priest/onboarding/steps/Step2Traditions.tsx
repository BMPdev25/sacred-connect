import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ChipSelector from '@/components/priest/onboarding/ChipSelector';
import { TRADITION_OPTIONS } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { updateStep2Data } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { Ceremony, fetchCeremonies } from '@/services/metadataService';
import { SelectedCeremony } from '@/types/priest.types';
import { StepRef } from '@/types/stepRef.types';

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
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { loadCeremonies(); }, []);

  async function loadCeremonies(): Promise<void> {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCeremonies();
      setCeremonies(data);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load ceremony types.');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Religious tradition is single-select (radio behavior): picking one
   * replaces any prior selection. The data shape stays string[] (length 1)
   * so Redux/API/model are unaffected.
   */
  function handleTraditionSelect(value: string): void {
    dispatch(updateStep2Data({ religiousTraditions: [value] }));
  }

  /** Toggles a puja (by name, as shown in the chip) in the selected list. */
  function handleSpecializationToggle(name: string): void {
    const ceremony = ceremonies.find((c) => c.name === name);
    if (!ceremony) return;
    const isSelected = step2.specializations.some((s) => s.ceremonyId === ceremony._id);
    const next: SelectedCeremony[] = isSelected
      ? step2.specializations.filter((s) => s.ceremonyId !== ceremony._id)
      : [...step2.specializations, { ceremonyId: ceremony._id, ceremonyName: ceremony.name }];
    dispatch(updateStep2Data({ specializations: next }));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (step2.religiousTraditions.length < 1) {
        errs.push('Select your tradition');
      }
      if (step2.specializations.length < 1) {
        errs.push('Select at least one puja you offer');
      }
      setErrors(errs);
      return errs.length === 0;
    },
  }));

  const ceremonyNames = ceremonies.map((c) => c.name);
  const selectedNames = step2.specializations.map((s) => s.ceremonyName);

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
        onToggle={handleTraditionSelect}
      />

      {/* Pujas Section */}
      <Text style={styles.sectionHeading}>Pujas You Offer</Text>
      <Text style={styles.sectionSubtext}>
        Select every puja you perform. You&apos;ll set your price for each in the next step.
      </Text>

      {isLoading ? <ActivityIndicator color={THEME.colors.primary} /> : null}

      {loadError && !isLoading ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>{loadError}</Text>
          <TouchableOpacity onPress={loadCeremonies} style={styles.retryBtn} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry loading pujas</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !loadError ? (
        <ChipSelector
          options={ceremonyNames}
          selected={selectedNames}
          onToggle={handleSpecializationToggle}
        />
      ) : null}

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
  sectionSubtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: -THEME.spacing.sm,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: THEME.colors.error,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  bannerErrorText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.error,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.error,
  },
  retryBtnText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.surface,
    fontWeight: '600',
  },
});
