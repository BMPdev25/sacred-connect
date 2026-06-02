import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Step5Availability } from '@/components/priest/onboarding/steps/Step5Availability';
import { useEditAvailability } from '@/components/priest/useEditAvailability';

/**
 * Screen enabling priests to adjust their weekly schedule hours
 * and toggle blocked/unavailable dates interactively on a calendar.
 */
export default function EditAvailability(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    blockedDates,
    isLoading,
    isSaving,
    hasHydrated,
    handleDayPress,
    handleSave,
  } = useEditAvailability();

  // Highlight blocked dates on the calendar in red
  const markedDates = useMemo(() => {
    const marked: any = {};
    blockedDates.forEach((date) => {
      marked[date] = {
        selected: true,
        selectedColor: THEME.colors.error,
        selectedTextColor: '#FFFFFF',
      };
    });
    return marked;
  }, [blockedDates]);

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
        <Text style={styles.screenTitle}>Edit Availability</Text>
        <Text style={styles.screenSubtext}>
          Configure your weekly availability hours and select specific dates to block out.
        </Text>

        {/* Weekly Schedule Section */}
        <View style={styles.sectionWrap}>
          <Step5Availability />
        </View>

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Block Off Dates</Text>
          <Text style={styles.sectionSubtitle}>
            Tap dates on the calendar below to toggle your availability (e.g. personal days, festivals). Blocked dates appear in red.
          </Text>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              todayTextColor: THEME.colors.primary,
              arrowColor: THEME.colors.primary,
              selectedDayBackgroundColor: THEME.colors.error,
              selectedDayTextColor: '#FFFFFF',
              todayBorderColor: THEME.colors.primary,
            } as any}
          />
        </View>
      </ScrollView>

      {/* STICKY BOTTOM BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) }]}>
        <PrimaryButton
          title="Save Availability"
          disabled={isSaving}
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
  sectionWrap: {
    flex: 1,
  },
  calendarSection: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  sectionTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.maroon,
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
  },
  bottomBar: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
