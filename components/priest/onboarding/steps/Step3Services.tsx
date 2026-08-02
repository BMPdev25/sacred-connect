import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import {
  CeremonyModal,
  DurationModal,
  EmptyServiceState,
  ServiceCard,
  ServiceFormCard,
  ServiceFormErrors,
  ServiceFormValues,
  buildUpdatedList,
  validateServiceForm,
} from '@/components/priest/onboarding/steps/Step3.subcomponents';
import { DURATION_OPTIONS } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { updateStep3Services } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { Ceremony, fetchCeremonies } from '@/services/metadataService';
import { PriestService } from '@/types/priest.types';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: ServiceFormValues = { ceremonyId: '', ceremonyName: '', durationMinutes: 0, price: '' };

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Step 3 of the priest onboarding wizard.
 * Lets priests add, edit, and remove offered services with ceremony type,
 * duration, and pricing. Fetches available ceremony types from the API on mount.
 */
export const Step3Services = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const reduxServices = useSelector((state: RootState) => state.onboarding.step3.services);

  const [services, setServices] = useState<PriestService[]>(reduxServices);

  useEffect(() => {
    setServices(reduxServices);
  }, [reduxServices]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ServiceFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [availableCeremonies, setAvailableCeremonies] = useState<Ceremony[]>([]);
  const [isCeremonyModalOpen, setIsCeremonyModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [isLoadingCeremonies, setIsLoadingCeremonies] = useState(false);
  const [ceremoniesError, setCeremoniesError] = useState<string | null>(null);

  useEffect(() => { loadCeremonies(); }, []);

  async function loadCeremonies(): Promise<void> {
    setIsLoadingCeremonies(true);
    setCeremoniesError(null);
    try {
      const data = await fetchCeremonies();
      setAvailableCeremonies(data);
    } catch (err: any) {
      setCeremoniesError(err.message || 'Failed to load ceremony types.');
    } finally {
      setIsLoadingCeremonies(false);
    }
  }

  function openAddForm(): void {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingIndex(null);
    setIsFormOpen(true);
  }

  function openEditForm(index: number): void {
    const svc = services[index];
    setFormValues({ ceremonyId: svc.ceremonyId, ceremonyName: svc.ceremonyName, durationMinutes: svc.durationMinutes, price: String(svc.price) });
    setFormErrors({});
    setEditingIndex(index);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingIndex(null);
  }

  function handleCeremonySelect(ceremony: Ceremony): void {
    setFormValues((prev) => ({ ...prev, ceremonyId: ceremony._id, ceremonyName: ceremony.name }));
    setIsCeremonyModalOpen(false);
  }

  function handleDurationSelect(option: { label: string; value: number }): void {
    setFormValues((prev) => ({ ...prev, durationMinutes: option.value }));
    setIsDurationModalOpen(false);
  }

  function handleSaveService(): void {
    const errors = validateServiceForm(formValues);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const updated = buildUpdatedList(services, formValues, editingIndex);
    setServices(updated);
    dispatch(updateStep3Services(updated));
    closeForm();
    setStepErrors([]);
  }

  function handleDeleteService(index: number): void {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
    dispatch(updateStep3Services(updated));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (services.length < 1) {
        errs.push('Add at least one service to continue');
      } else {
        const hasInvalid = services.some((s) => !s.ceremonyId || s.ceremonyId.trim() === '');
        if (hasInvalid) {
          errs.push('One or more services have invalid ceremony selections. Please remove and re-add them.');
        }
      }
      setStepErrors(errs);
      return errs.length === 0;
    },
    validateStep3: () => {
      const errs: string[] = [];
      if (services.length < 1) {
        errs.push('Add at least one service to continue');
      } else {
        const hasInvalid = services.some((s) => !s.ceremonyId || s.ceremonyId.trim() === '');
        if (hasInvalid) {
          errs.push('One or more services have invalid ceremony selections. Please remove and re-add them.');
        }
      }
      setStepErrors(errs);
      return { isValid: errs.length === 0, errors: errs };
    }
  } as any));

  const selectedDurationLabel = DURATION_OPTIONS.find((o) => o.value === formValues.durationMinutes)?.label ?? '';

  const addedCeremonyIds = services.map((s) => s.ceremonyId);
  const filteredCeremonies = availableCeremonies.filter((c) => !addedCeremonyIds.includes(c._id));

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={80}
    >

      {ceremoniesError && !isFormOpen ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>{ceremoniesError}</Text>
          <TouchableOpacity onPress={loadCeremonies} style={styles.retryBtn} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry loading ceremonies</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {services.length === 0 && !isFormOpen ? <EmptyServiceState /> : null}

      {services.length > 0 && !isFormOpen ? (
        <FlatList
          data={services}
          keyExtractor={(svc, i) => `${svc.ceremonyId}-${i}`}
          renderItem={({ item, index }) => (
            <ServiceCard service={item} index={index} onEdit={openEditForm} onDelete={handleDeleteService} />
          )}
          scrollEnabled={false}
        />
      ) : null}

      {stepErrors.map((err) => <Text key={err} style={styles.stepError}>{err}</Text>)}

      {!isFormOpen && filteredCeremonies.length === 0 && services.length > 0 && !ceremoniesError ? (
        <View style={styles.allAddedBanner}>
          <Text style={styles.allAddedText}>All services added</Text>
        </View>
      ) : null}

      {!isFormOpen && (filteredCeremonies.length > 0 || ceremoniesError) && (
        <TouchableOpacity
          style={[styles.addBtn, ceremoniesError ? styles.disabledBtn : null]}
          onPress={ceremoniesError ? undefined : openAddForm}
          activeOpacity={ceremoniesError ? 1 : 0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={ceremoniesError ? THEME.colors.disabled : THEME.colors.primary}
          />
          <Text style={[styles.addBtnText, ceremoniesError ? styles.disabledBtnText : null]}>Add Service</Text>
        </TouchableOpacity>
      )}

      {isFormOpen && (
        <ServiceFormCard
          formValues={formValues}
          formErrors={formErrors}
          editingIndex={editingIndex}
          selectedDurationLabel={selectedDurationLabel}
          onFieldChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
          onOpenCeremonyModal={() => setIsCeremonyModalOpen(true)}
          onOpenDurationModal={() => setIsDurationModalOpen(true)}
          onCancel={closeForm}
          onSave={handleSaveService}
        />
      )}

      <CeremonyModal visible={isCeremonyModalOpen} ceremonies={filteredCeremonies} onSelect={handleCeremonySelect} onClose={() => setIsCeremonyModalOpen(false)} />
      <DurationModal visible={isDurationModalOpen} options={DURATION_OPTIONS} onSelect={handleDurationSelect} onClose={() => setIsDurationModalOpen(false)} />
    </KeyboardAwareScrollView>
  );
});

Step3Services.displayName = 'Step3Services';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: THEME.spacing.md, gap: THEME.spacing.md },
  stepError: { fontSize: THEME.typography.caption, color: THEME.colors.error },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: THEME.spacing.xs, borderWidth: 1.5, borderColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill, paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
  },
  addBtnText: { fontSize: THEME.typography.body, color: THEME.colors.primary, fontWeight: '600' },
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
  disabledBtn: {
    borderColor: THEME.colors.disabled,
  },
  disabledBtnText: {
    color: THEME.colors.disabled,
  },
  allAddedBanner: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  allAddedText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
});

