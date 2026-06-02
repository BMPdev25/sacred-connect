import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Step3Services } from '@/components/priest/onboarding/steps/Step3Services';
import { updateStep3Services } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { CalendarService } from '@/services/priest/calendarService';
import { PriestService } from '@/types/priest.types';

/**
 * Screen enabling priests to manage their list of ceremonies and price points.
 * Reuses Step3Services onboarding component directly.
 */
export default function EditServices(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const services = useSelector((state: RootState) => state.onboarding.step3.services);

  const { data: priestProfile, isLoading } = useQuery({
    queryKey: ['myPriestProfile'],
    queryFn: CalendarService.fetchPriestProfile,
    staleTime: 300000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Pre-populate Redux slice state on mount from cached query profile
  useEffect(() => {
    if (priestProfile && !hasHydrated) {
      const mappedServices: PriestService[] = priestProfile.services?.map((s: any) => {
        let ceremonyId = '';
        let ceremonyName = s.ceremonyName || '';

        if (s.ceremonyId) {
          if (typeof s.ceremonyId === 'string') {
            ceremonyId = s.ceremonyId;
          } else {
            ceremonyId = s.ceremonyId._id;
            if (s.ceremonyId.name) {
              ceremonyName = s.ceremonyId.name;
            }
          }
        }

        return {
          ceremonyId,
          ceremonyName,
          durationMinutes: s.durationMinutes || 0,
          price: s.price || 0,
        };
      }) || [];

      dispatch(updateStep3Services(mappedServices));
      setHasHydrated(true);
    }
  }, [priestProfile, hasHydrated, dispatch]);

  const handleSave = async () => {
    const hasInvalid = services.some((s) => !s.ceremonyId || s.ceremonyId.trim() === '');
    if (hasInvalid) {
      Alert.alert('Error', 'One or more services have invalid selections.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        services: services.map((s) => ({
          ceremonyId: s.ceremonyId,
          price: s.price,
          durationMinutes: s.durationMinutes,
        })),
      };

      await CalendarService.updatePriestProfile(payload);
      queryClient.invalidateQueries({ queryKey: ['myPriestProfile'] });

      if (Platform.OS === 'android') {
        ToastAndroid.show('Services updated successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Services updated successfully');
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save services. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !hasHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.safeArea}>
      {/* ABSOLUTE BACK BUTTON */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Edit Services</Text>
        <Text style={styles.screenSubtext}>
          Manage the ceremonies you offer and their pricing
        </Text>

        <View style={styles.formContainer}>
          <Step3Services />
        </View>
      </ScrollView>

      {/* STICKY BOTTOM BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) }]}>
        <PrimaryButton
          title="Save Services"
          disabled={services.length === 0 || isSaving}
          loading={isSaving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.xl,
  },
  screenTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginHorizontal: THEME.spacing.md,
  },
  screenSubtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  formContainer: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
