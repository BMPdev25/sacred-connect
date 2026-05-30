import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { CalendarService } from '@/services/priest/calendarService';
import { generateBookingRef } from '@/utils/bookingCardUtils';
import { formatDisplayDate } from '@/utils/bookingUtils';
import BookingTimeline from '@/components/shared/BookingTimeline';
import DevoteeCard from '@/components/priest/DevoteeCard';
import CeremonyCard from '@/components/priest/CeremonyCard';
import EarningsCard from '@/components/priest/EarningsCard';

function isDateTodayOrPast(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    const today = new Date();
    return bookingDate <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  } catch {
    return false;
  }
}

function StatusHeader({ ceremonyType, status, bookingRef }: { ceremonyType: string; status: string; bookingRef: string }): React.JSX.Element {
  const getStatusStyle = () => {
    if (status === 'confirmed') return [styles.statusBadge, styles.statusConfirmed];
    if (status === 'completed') return [styles.statusBadge, styles.statusCompleted];
    return [styles.statusBadge, styles.statusCancelled];
  };

  const textStyle = status === 'confirmed' ? styles.textConfirmed : status === 'completed' ? styles.textCompleted : styles.textCancelled;

  return (
    <View style={styles.statusHeaderContainer}>
      <Text style={styles.ceremonyTitle} numberOfLines={2}>{ceremonyType}</Text>
      <Text style={styles.bookingRef}>{bookingRef}</Text>
      <View style={getStatusStyle()}>
        <Text style={[styles.statusText, textStyle]}>
          {status === 'confirmed' ? 'Confirmed' : status === 'completed' ? 'Completed' : 'Cancelled'}
        </Text>
      </View>
    </View>
  );
}

export default function PriestBookingDetails(): React.JSX.Element {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [isMarkingComplete, setIsMarkingComplete] = useState<boolean>(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['priestBookingDetail', bookingId],
    queryFn: () => CalendarService.fetchBookingDetail(bookingId!),
    staleTime: 30000,
    enabled: !!bookingId,
  });

  const confirmMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      await CalendarService.markBookingComplete(bookingId!);
      queryClient.invalidateQueries({ queryKey: ['priestCalendarBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestBookingDetail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['priestDashboard'] });
      Alert.alert('Ceremony Completed! ✓', `₹${booking.basePrice.toLocaleString('en-IN')} has been credited to your wallet.`, [{ text: 'Great!' }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete booking.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleMarkComplete = () => {
    Alert.alert('Mark as Complete?', `Confirm you have completed the ${booking.ceremonyType} ceremony with ${booking.devoteeId?.name || 'Devotee'}.`, [
      { text: 'Not Yet', style: 'cancel' },
      { text: 'Yes, Mark Complete', onPress: confirmMarkComplete }
    ]);
  };

  if (isLoading || !booking) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const bookingRef = generateBookingRef(booking);
  const canMarkComplete = booking.status === 'confirmed' && isDateTodayOrPast(booking.date);
  const isFuture = booking.status === 'confirmed' && !isDateTodayOrPast(booking.date);

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }}>
        <StatusHeader ceremonyType={booking.ceremonyType} status={booking.status} bookingRef={bookingRef} />
        <DevoteeCard devoteeId={booking.devoteeId} status={booking.status} isFirstTimeDevotee={booking.isFirstTimeDevotee || booking.isFirstBooking} />
        <CeremonyCard date={booking.date} startTime={booking.startTime} endTime={booking.endTime} address={booking.location?.address} />
        <EarningsCard basePrice={booking.basePrice} status={booking.status} />
        <BookingTimeline status={booking.status} />

        <View style={styles.actionPanel}>
          {canMarkComplete && (
            <>
              <View style={styles.infoBanner}>
                <Ionicons name="notifications-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.infoBannerText}>Today's ceremony — ready to mark as complete?</Text>
              </View>
              <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete} disabled={isMarkingComplete} activeOpacity={0.8}>
                {isMarkingComplete ? <ActivityIndicator color="#FFF" /> : (
                  <View style={styles.btnRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.completeBtnText}>Mark as Complete</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {isFuture && (
            <View style={styles.scheduledBanner}>
              <Text style={styles.scheduledText}>Your ceremony is scheduled for {formatDisplayDate(booking.date)}</Text>
            </View>
          )}

          {booking.status === 'completed' && (
            <View style={[styles.scheduledBanner, styles.completedBanner]}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={styles.bannerIcon} />
              <Text style={[styles.scheduledText, styles.completedText]}>Ceremony completed. ₹{booking.basePrice.toLocaleString('en-IN')} credited to your wallet.</Text>
            </View>
          )}

          {booking.status === 'cancelled' && (
            <View style={[styles.scheduledBanner, styles.cancelledBanner]}>
              <Text style={[styles.scheduledText, styles.cancelledText]}>This booking was cancelled.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  centerAlign: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { position: 'absolute', left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40 },
  backBtn: { position: 'absolute', left: 16, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.maroon },
  statusHeaderContainer: { backgroundColor: '#FFF3E0', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, alignItems: 'center' },
  ceremonyTitle: { fontSize: 22, fontWeight: '700', color: THEME.colors.textPrimary, textAlign: 'center' },
  bookingRef: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: THEME.colors.gold, marginTop: 4, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: THEME.borderRadius.pill, marginTop: 8 },
  statusConfirmed: { backgroundColor: '#DCFCE7' },
  statusCompleted: { backgroundColor: '#F1F5F9' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '700' },
  textConfirmed: { color: '#16A34A' },
  textCompleted: { color: '#475569' },
  textCancelled: { color: '#DC2626' },
  actionPanel: { marginTop: 8, paddingBottom: 16 },
  infoBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  infoBannerText: { flex: 1, fontSize: THEME.typography.bodySmall, color: THEME.colors.textSecondary, paddingLeft: 8, fontWeight: '500' },
  completeBtn: { backgroundColor: '#16A34A', height: 56, borderRadius: 28, marginHorizontal: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  completeBtnText: { fontSize: THEME.typography.body, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 },
  scheduledBanner: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, marginHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  scheduledText: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  completedBanner: { backgroundColor: '#DCFCE7', borderColor: '#A7F3D0', flexDirection: 'row' },
  bannerIcon: { marginRight: 8 },
  completedText: { color: '#166534' },
  cancelledBanner: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  cancelledText: { color: '#991B1B' },
});
