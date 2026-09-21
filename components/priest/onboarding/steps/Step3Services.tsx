import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';

import { PriceRow, PriceRowValues, validatePrice } from '@/components/priest/onboarding/steps/Step3.subcomponents';
import { THEME } from '@/constants/theme';
import { updateStep3Services } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { Ceremony, fetchCeremonies } from '@/services/metadataService';
import { PriestService } from '@/types/priest.types';
import { StepRef } from '@/types/stepRef.types';

const DEFAULT_DURATION_MINUTES = 60;

/**
 * Step 3 of the priest onboarding wizard.
 * Purely a price list: one row per puja the priest already selected as a
 * specialization in Step 2. There is no separate "add a ceremony" flow here
 * — the ceremony picker lives in Step 2. Duration is taken silently from the
 * catalog's typical duration; the priest only sets a price per puja.
 */
export const Step3Services = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const specializations = useSelector((state: RootState) => state.onboarding.step2.specializations);
  const savedServices = useSelector((state: RootState) => state.onboarding.step3.services);

  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [isLoadingCeremonies, setIsLoadingCeremonies] = useState(false);
  const [ceremoniesError, setCeremoniesError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => { loadCeremonies(); }, []);

  // Seed local price inputs from any previously saved services (resuming onboarding).
  useEffect(() => {
    const seeded: Record<string, string> = {};
    for (const spec of specializations) {
      const existing = savedServices.find((s) => s.ceremonyId === spec.ceremonyId);
      if (existing) seeded[spec.ceremonyId] = String(existing.price);
    }
    setPrices((prev) => ({ ...seeded, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specializations.length]);

  async function loadCeremonies(): Promise<void> {
    setIsLoadingCeremonies(true);
    setCeremoniesError(null);
    try {
      const data = await fetchCeremonies();
      setCeremonies(data);
    } catch (err: any) {
      setCeremoniesError(err.message || 'Failed to load ceremony types.');
    } finally {
      setIsLoadingCeremonies(false);
    }
  }

  const rows: PriceRowValues[] = specializations.map((spec) => {
    const ceremony = ceremonies.find((c) => c._id === spec.ceremonyId);
    return {
      ceremonyId: spec.ceremonyId,
      ceremonyName: spec.ceremonyName,
      basePrice: ceremony?.pricing?.basePrice,
      price: prices[spec.ceremonyId] ?? '',
    };
  });

  function commitServices(nextPrices: Record<string, string>): void {
    const services: PriestService[] = specializations.map((spec) => {
      const ceremony = ceremonies.find((c) => c._id === spec.ceremonyId);
      return {
        ceremonyId: spec.ceremonyId,
        ceremonyName: spec.ceremonyName,
        durationMinutes: ceremony?.duration?.typical || DEFAULT_DURATION_MINUTES,
        price: Number(nextPrices[spec.ceremonyId]) || 0,
      };
    });
    dispatch(updateStep3Services(services));
  }

  function handlePriceChange(ceremonyId: string, price: string): void {
    const next = { ...prices, [ceremonyId]: price };
    setPrices(next);
    commitServices(next);
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (specializations.length < 1) {
        setGeneralError('Go back to Step 2 and select at least one puja you offer.');
        setRowErrors({});
        return false;
      }
      const errs: Record<string, string> = {};
      for (const row of rows) {
        const err = validatePrice(row.price, row.basePrice);
        if (err) errs[row.ceremonyId] = err;
      }
      setRowErrors(errs);
      setGeneralError(null);
      return Object.keys(errs).length === 0;
    },
  }));

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={80}
    >
      <Text style={styles.heading}>Set Your Prices</Text>
      <Text style={styles.subtext}>
        Set the price you charge for each puja you selected in the previous step.
        Your price must be at or above the base price set by the admin.
      </Text>

      {ceremoniesError && !isLoadingCeremonies ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>{ceremoniesError}</Text>
          <TouchableOpacity onPress={loadCeremonies} style={styles.retryBtn} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry loading pujas</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!ceremoniesError && rows.length === 0 ? (
        <Text style={styles.emptyText}>
          No pujas selected yet. Go back to Step 2 to pick the pujas you offer.
        </Text>
      ) : null}

      {!ceremoniesError ? (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.ceremonyId}
          renderItem={({ item }) => (
            <PriceRow
              row={item}
              error={rowErrors[item.ceremonyId]}
              onChangePrice={(price) => handlePriceChange(item.ceremonyId, price)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: THEME.spacing.sm }} />}
          scrollEnabled={false}
        />
      ) : null}

      {generalError ? <Text style={styles.stepError}>{generalError}</Text> : null}
    </KeyboardAwareScrollView>
  );
});

Step3Services.displayName = 'Step3Services';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: THEME.spacing.md, gap: THEME.spacing.md },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.maroon,
  },
  subtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: -THEME.spacing.sm,
  },
  emptyText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  stepError: { fontSize: THEME.typography.caption, color: THEME.colors.error },
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
