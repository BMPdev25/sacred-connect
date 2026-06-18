import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { updateUserProfile } from '@/redux/slices/userSlice';
import { NotificationPreferences as NotificationPrefsType } from '@/types/profile.types';
import * as profileService from '@/services/user/profileService';
import { MenuSectionLabel } from '@/components/devotee/profile/MenuSectionLabel';
import { MenuCard } from '@/components/devotee/profile/MenuCard';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

/**
 * ToggleRow subcomponent rendering a label, description, and Switch toggle.
 */
function ToggleRow({ label, description, value, onChange }: ToggleRowProps): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.labelWrapper}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {!!description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: THEME.colors.primary, false: THEME.colors.border }}
        thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />
    </View>
  );
}

/**
 * Hook to automatically auto-save changed preferences with 500ms debounce.
 */
function useDebouncedNotificationSave(
  prefs: NotificationPrefsType,
  storedPrefs: NotificationPrefsType | undefined
): void {
  const dispatch = useDispatch();

  useEffect(() => {
    const hasChanged =
      !storedPrefs ||
      prefs.bookingConfirmations !== storedPrefs.bookingConfirmations ||
      prefs.upcomingReminders !== storedPrefs.upcomingReminders ||
      prefs.cancellationAlerts !== storedPrefs.cancellationAlerts ||
      prefs.festivalOffers !== storedPrefs.festivalOffers ||
      prefs.newFeatures !== storedPrefs.newFeatures;

    if (!hasChanged) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        await profileService.updateNotificationPreferences(prefs);
        dispatch(updateUserProfile({ notificationPrefs: prefs }));
      } catch (err) {
        // Silent failure — logging only
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [prefs, storedPrefs, dispatch]);
}

/**
 * NotificationPreferences Screen.
 * Allows devotees to toggle booking confirmations, reminders, cancels, and offers.
 */
export default function NotificationPreferences(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedPrefs = useSelector((state: RootState) => state.user.notificationPrefs);

  const [prefs, setPrefs] = useState<NotificationPrefsType>(() => ({
    bookingConfirmations: storedPrefs?.bookingConfirmations ?? true,
    upcomingReminders: storedPrefs?.upcomingReminders ?? true,
    cancellationAlerts: storedPrefs?.cancellationAlerts ?? true,
    festivalOffers: storedPrefs?.festivalOffers ?? true,
    newFeatures: storedPrefs?.newFeatures ?? true,
  }));

  useDebouncedNotificationSave(prefs, storedPrefs);

  const updatePref = (key: keyof NotificationPrefsType, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + THEME.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MenuSectionLabel label="BOOKINGS" />
        <MenuCard>
          <ToggleRow
            label="Booking confirmations"
            description="When a pandit accepts your booking"
            value={prefs.bookingConfirmations}
            onChange={(v) => updatePref('bookingConfirmations', v)}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Upcoming reminders"
            description="24 hours before your ceremony"
            value={prefs.upcomingReminders}
            onChange={(v) => updatePref('upcomingReminders', v)}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Cancellation alerts"
            value={prefs.cancellationAlerts}
            onChange={(v) => updatePref('cancellationAlerts', v)}
          />
        </MenuCard>

        <MenuSectionLabel label="PROMOTIONS" />
        <MenuCard>
          <ToggleRow
            label="Festival offers and deals"
            description="Special deals during festive seasons"
            value={prefs.festivalOffers}
            onChange={(v) => updatePref('festivalOffers', v)}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="New features"
            description="Product updates and announcements"
            value={prefs.newFeatures}
            onChange={(v) => updatePref('newFeatures', v)}
          />
        </MenuCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerContainer: {
    height: 56,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 8,
    padding: 8,
    zIndex: 12,
  },
  titleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  headerTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
  },
  labelWrapper: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  toggleLabel: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginLeft: THEME.spacing.md,
  },
});
