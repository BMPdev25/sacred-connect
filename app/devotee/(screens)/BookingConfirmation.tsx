import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, BackHandler, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';

import { RootState } from '@/redux/store';
import { clearBookingDraft } from '@/redux/slices/bookingSlice';
import { getProfilePicSource } from '@/utils/imageUtils';
import { fetchBookingDetails } from '@/services/devotee/bookingManagementService';
import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';
import { BackendBooking, BookingDraft } from '@/types/booking.types';
import { BookingListItem } from '@/types/bookingManagement.types';

const handleAddToCalendar = async (draft: BookingDraft) => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Calendar permission is needed to add events.');
    return;
  }
  
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  if (!defaultCalendar) {
    Alert.alert('Error', 'No default calendar found.');
    return;
  }

  const startStr = `${draft.selectedDate}T${draft.selectedTimeSlot?.startTime}:00`;
  const endStr = `${draft.selectedDate}T${draft.selectedTimeSlot?.endTime}:00`;
  
  try {
    await Calendar.createEventAsync(defaultCalendar.id, {
      title: `${draft.selectedService?.ceremonyName} — Sacred Connect`,
      startDate: new Date(startStr),
      endDate: new Date(endStr),
      location: draft.selectedAddress?.fullAddress,
      notes: `Booking ref: ${draft.bookingReference}\nPandit: ${draft.priestName}`,
    });
    Alert.alert('Added!', 'Ceremony added to your calendar');
  } catch (err) {
    Alert.alert('Error', 'Failed to add to calendar');
  }
};

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={THEME.colors.primary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function CeremonyDetailsCard({ draft }: { draft: BookingDraft }) {
  const shortAddress = draft.selectedAddress ? `${draft.selectedAddress.city}, ${draft.selectedAddress.street}` : '';
  const timeRange = draft.selectedTimeSlot ? `${draft.selectedTimeSlot.displayLabel} - ${formatTime12Hour(draft.selectedTimeSlot.endTime)}` : '';

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.cardHeading}>{draft.selectedService?.ceremonyName}</Text>
        <Text style={styles.paidText}>₹{(draft.pricing?.totalAmount || 0).toLocaleString('en-IN')} Paid</Text>
      </View>
      <View style={styles.divider} />
      <DetailRow icon="calendar-outline" text={formatDisplayDate(draft.selectedDate || '')} />
      <DetailRow icon="time-outline" text={timeRange} />
      <DetailRow icon="location-outline" text={shortAddress} />
    </View>
  );
}

function PanditContactCard({ draft, confirmedBooking }: { draft: BookingDraft, confirmedBooking: BookingListItem | null }) {
  const priestPhone = (confirmedBooking as any)?.priestPhone || 'Phone will be shared before the ceremony';
  // Use getProfilePicSource to safely handle string, object {url}, or null
  const avatarSource = getProfilePicSource(
    draft.priestProfilePicture,
    AssetService.getImage('shared.avatarPlaceholder')
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>Your Pandit</Text>
      <View style={styles.panditRow}>
        <Image source={avatarSource as any} style={styles.avatar} />
        <View style={styles.panditContent}>
          <Text style={styles.panditName}>{draft.priestName}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        </View>
      </View>
      <View style={styles.phoneRow}>
        <Ionicons name="call-outline" size={18} color={THEME.colors.primary} />
        <Text style={styles.phoneText}>{priestPhone}</Text>
      </View>
      <Text style={styles.panditNote}>The pandit will call you before the ceremony</Text>
    </View>
  );
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const draft = useSelector((state: RootState) => state.booking);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingListItem | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Booking Confirmed', 'Your booking is confirmed. Use the buttons below to continue.');
      return true; // block navigation
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (draft.createdBookingId) {
      fetchBookingDetails(draft.createdBookingId).then(setConfirmedBooking).catch(() => {});
    }
  }, [draft.createdBookingId]);

  const handleFinish = (target: 'home' | 'bookings') => {
    dispatch(clearBookingDraft());
    if (target === 'home') {
      router.replace('/devotee/HomeTab' as any);
    } else {
      router.replace('/devotee/BookingsTab' as any);
    }
  };

  const successImage = AssetService.getImage('booking.confirmationSuccess');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Image source={successImage as any} style={styles.illustration} />
          <Text style={styles.mainTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.subTitle}>Your puja is successfully booked</Text>
        </View>

        <View style={styles.refCard}>
          <Text style={styles.refCaption}>BOOKING REFERENCE</Text>
          <Text style={styles.refNumber}>{draft.bookingReference}</Text>
          <Text style={styles.refNote}>Save this reference number</Text>
        </View>

        <CeremonyDetailsCard draft={draft} />
        <PanditContactCard draft={draft} confirmedBooking={confirmedBooking} />

        <View style={styles.actionSection}>
          <PrimaryButton title="View My Bookings" onPress={() => handleFinish('bookings')} />
          <View style={styles.btnSpacing} />
          <PrimaryButton title="Add to Calendar" variant="outline" onPress={() => handleAddToCalendar(draft)} />
          <TouchableOpacity onPress={() => handleFinish('home')} style={styles.homeLink}>
            <Text style={styles.homeLinkText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.colors.background },
  scrollContent: { paddingTop: THEME.spacing.md },
  topSection: { alignItems: 'center', paddingTop: THEME.spacing.xxl, paddingHorizontal: THEME.spacing.lg },
  illustration: { width: '65%', height: undefined, aspectRatio: 1, resizeMode: 'contain' },
  mainTitle: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.maroon, marginTop: THEME.spacing.md, textAlign: 'center' },
  subTitle: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  refCard: { backgroundColor: THEME.colors.surface, marginHorizontal: 16, borderRadius: 16, padding: 20, marginTop: THEME.spacing.xl, marginBottom: THEME.spacing.md, ...THEME.shadow.card },
  refCaption: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: THEME.spacing.sm },
  refNumber: { fontSize: 20, fontWeight: '700', color: THEME.colors.gold, textAlign: 'center', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  refNote: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted, textAlign: 'center', marginTop: THEME.spacing.xs },
  card: { backgroundColor: THEME.colors.surface, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: THEME.spacing.md, ...THEME.shadow.card },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeading: { fontSize: THEME.typography.subheading, fontWeight: '700', color: THEME.colors.textPrimary },
  paidText: { fontSize: THEME.typography.body, fontWeight: '600', color: '#16A34A' },
  divider: { height: 1, backgroundColor: THEME.colors.border, marginVertical: THEME.spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.spacing.sm },
  detailText: { fontSize: THEME.typography.body, color: THEME.colors.textPrimary, marginLeft: THEME.spacing.sm },
  panditRow: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: THEME.colors.border },
  panditContent: { marginLeft: THEME.spacing.sm },
  panditName: { fontSize: THEME.typography.subheading, fontWeight: '600', color: THEME.colors.textPrimary },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4 },
  verifiedText: { fontSize: THEME.typography.caption, color: '#16A34A', fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.spacing.sm },
  phoneText: { fontSize: THEME.typography.body, color: THEME.colors.textPrimary, marginLeft: 8 },
  panditNote: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, marginTop: THEME.spacing.xs },
  actionSection: { paddingHorizontal: 16, marginTop: THEME.spacing.md },
  btnSpacing: { height: 12 },
  homeLink: { marginTop: THEME.spacing.xl, alignItems: 'center' },
  homeLinkText: { fontSize: THEME.typography.body, fontWeight: '600', color: THEME.colors.primary },
});
