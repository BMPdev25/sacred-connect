import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { fetchBookingDetails, cancelBooking } from '@/services/devotee/bookingManagementService';
import { checkExistingRating } from '@/services/devotee/ratingService';
import { generateBookingRef } from '@/utils/bookingCardUtils';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';
import { ExistingRating } from '@/types/bookingManagement.types';
import { AssetService } from '@/services/assets/AssetService';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { DetailCard } from '@/components/devotee/bookings/DetailCard';
import { DetailRow } from '@/components/devotee/bookings/DetailRow';
import { StatusTimeline } from '@/components/devotee/bookings/StatusTimeline';
import { StarDisplay } from '@/components/shared/StarDisplay';
import { DetailStatusSection } from '@/components/devotee/bookings/DetailStatusSection';
import { DetailPanditCard } from '@/components/devotee/bookings/DetailPanditCard';
import { DetailPaymentSection } from '@/components/devotee/bookings/DetailPaymentSection';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingDetails() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [isCancelling, setIsCancelling] = useState(false);
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['bookingDetail', bookingId],
    queryFn: () => fetchBookingDetails(bookingId!),
    staleTime: 30 * 1000,
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking?.status === 'completed' && bookingId) {
      checkExistingRating(bookingId).then((res) => {
        if (res) setExistingRating(res);
      });
    }
  }, [booking?.status, bookingId]);

  const confirmCancel = async () => {
    if (!bookingId) return;
    setIsCancelling(true);
    try {
      await cancelBooking(bookingId);
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['pastBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', bookingId] });
      Alert.alert('Cancelled', 'Your booking has been cancelled.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking?',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: confirmCancel },
      ]
    );
  };

  const handleRateNow = () => {
    router.push({ pathname: '/devotee/(screens)/RateReview' as any, params: { bookingId } });
  };

  if (isLoading || !booking) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');

  return (
    <View style={styles.safeArea}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <Text style={styles.screenTitle}>Booking Details</Text>
        
        {/* Status Section */}
        <DetailStatusSection
          status={booking.status}
          bookingRef={generateBookingRef(booking)}
        />

        {/* Ceremony Details */}
        <DetailCard title="Ceremony Details">
          <DetailRow iconName="pricetag-outline" text={booking.ceremonyType} />
          <DetailRow iconName="calendar-outline" text={formatDisplayDate(booking.date)} />
          <DetailRow
            iconName="time-outline"
            text={`${formatTime12Hour(booking.startTime)} – ${formatTime12Hour(booking.endTime)}`}
          />
          <DetailRow iconName="location-outline" text={booking.location.address} isLast />
        </DetailCard>

        {/* Your Pandit */}
        <DetailPanditCard
          status={booking.status}
          priestName={booking.priestId.name}
          profilePicture={booking.priestId.profilePicture}
          avatarPlaceholder={avatarPlaceholder}
        />

        {/* Payment Details */}
        <DetailPaymentSection
          basePrice={booking.basePrice}
          platformFee={booking.platformFee}
          totalAmount={booking.totalAmount}
        />

        {/* Status Timeline */}
        <StatusTimeline status={booking.status} />

        {/* Actions Section */}
        <View style={styles.actionSection}>
          {booking.status === 'pending' && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>Awaiting pandit confirmation</Text>
            </View>
          )}

          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <>
              <PrimaryButton
                title="Cancel Booking"
                variant="outline"
                loading={isCancelling}
                onPress={handleCancelBooking}
                style={{ borderColor: THEME.colors.error }}
              />
              <Text style={styles.cancelNotice}>Free cancellation if 24+ hours before ceremony</Text>
            </>
          )}

          {booking.status === 'completed' && (
            <>
              {!existingRating ? (
                <>
                  <PrimaryButton title="Rate Your Experience" onPress={handleRateNow} />
                  <Text style={styles.cancelNotice}>Share your experience to help others</Text>
                </>
              ) : (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>You rated this booking</Text>
                  <StarDisplay rating={existingRating.rating} size={16} />
                  <TouchableOpacity onPress={handleRateNow}>
                    <Text style={styles.editRatingText}>Edit your rating →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {(booking.status === 'cancelled' || booking.status === 'rejected') && (
            <PrimaryButton
              title={booking.status === 'cancelled' ? 'Book Again with this Pandit' : 'Find Another Pandit'}
              variant="outline"
              onPress={() => router.push('/devotee/(tabs)/ExploreTab' as any)}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.colors.background, position: 'relative' },
  backBtn: { position: 'absolute', left: 16, zIndex: 10, padding: 8 },
  screenTitle: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.maroon, paddingHorizontal: 16, marginBottom: THEME.spacing.md },
  scrollContent: { paddingBottom: 24 },
  actionSection: { paddingHorizontal: 16, paddingVertical: 16, marginTop: 8 },
  cancelNotice: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, textAlign: 'center', marginTop: THEME.spacing.sm },
  infoBanner: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 12 },
  infoBannerText: { color: '#D97706', fontSize: THEME.typography.body, textAlign: 'center', fontWeight: '500' },
  ratingRow: { flexDirection: 'column', alignItems: 'center', gap: 8, paddingVertical: 12 },
  ratingLabel: { fontSize: THEME.typography.body, color: THEME.colors.textPrimary, fontWeight: '500' },
  editRatingText: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted, marginTop: 4 },
});
