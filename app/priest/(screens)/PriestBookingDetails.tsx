import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { PriestRequestsService } from '@/services/priest/priestRequestsService';
import { EarningsService } from '@/services/priest/earningsService';
import { CalendarService } from '@/services/priest/calendarService';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';

/** Formatted earnings display row */
function InfoRow({
  iconName,
  label,
  value,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={iconName} size={18} color={THEME.colors.primary} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Status badge colors */
function getStatusStyle(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    confirmed: { bg: '#D1FAE5', text: '#065F46' },
    completed: { bg: '#DBEAFE', text: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
  };
  return map[status] ?? { bg: '#F3F4F6', text: '#374151' };
}

/**
 * PriestBookingDetails screen — shows full booking details for the priest.
 * If the booking is confirmed, the priest can mark it as complete from here.
 */
export default function PriestBookingDetails(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [isCompleting, setIsCompleting] = useState(false);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['priestBookingDetail', bookingId],
    queryFn: () => PriestRequestsService.fetchRequestDetail(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });

  /** Mark this booking as complete — triggers wallet credit on backend. */
  const handleMarkComplete = async () => {
    if (!bookingId) return;

    Alert.alert(
      'Mark as Completed?',
      'Confirm that the ceremony has been performed. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            setIsCompleting(true);
            try {
              await CalendarService.markBookingComplete(bookingId);
              // Refresh earnings, calendar and today's bookings
              queryClient.invalidateQueries({ queryKey: ['priestEarnings'] });
              queryClient.invalidateQueries({ queryKey: ['priestTransactions'] });
              queryClient.invalidateQueries({ queryKey: ['priestCalendarBookings'] });
              queryClient.invalidateQueries({ queryKey: ['priestBookingDetail', bookingId] });
              Alert.alert('Done! 🎉', 'Booking marked complete. Earnings have been credited to your wallet.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to mark complete');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.textMuted} />
        <Text style={styles.errorText}>Unable to load booking details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { bg: statusBg, text: statusText } = getStatusStyle(booking.status ?? 'pending');
  const isPaid = (booking as any).paymentStatus === 'completed';

  return (
    <View style={styles.container}>
      {/* Back button — absolutely positioned per project rules */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backIcon, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Text style={styles.screenTitle}>Booking Details</Text>

        {/* Devotee card */}
        <View style={styles.card}>
          <View style={styles.devoteeRow}>
            <View style={styles.devoteeAvatar}>
              <Ionicons name="person" size={24} color={THEME.colors.textMuted} />
            </View>
            <View style={styles.devoteeInfo}>
              <Text style={styles.devoteeName}>{booking.devoteeId.name}</Text>
              <Text style={styles.devoteeSubtitle}>Devotee</Text>
            </View>
          </View>
        </View>

        {/* Ceremony details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ceremony Details</Text>
          <InfoRow iconName="pricetag-outline" label="Ceremony" value={booking.ceremonyType} />
          <InfoRow
            iconName="calendar-outline"
            label="Date"
            value={formatDisplayDate(booking.date)}
          />
          <InfoRow
            iconName="time-outline"
            label="Time"
            value={`${formatTime12Hour(booking.startTime)} – ${formatTime12Hour(booking.endTime)}`}
          />
          <InfoRow iconName="location-outline" label="Location" value={booking.location.address} />
        </View>

        {/* Earnings card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          <Text style={styles.earningsAmount}>
            ₹{booking.basePrice.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.earningsNote}>Credited to wallet on completion</Text>

          {/* Payment status — devotee pays after acceptance in the instant flow,
              so a confirmed booking can still be awaiting payment. */}
          {isPaid ? (
            <View style={[styles.paymentBanner, styles.paymentPaid]}>
              <Ionicons name="checkmark-circle" size={16} color="#166534" />
              <Text style={[styles.paymentText, { color: '#166534' }]}>Payment received</Text>
            </View>
          ) : (
            <View style={[styles.paymentBanner, styles.paymentPending]}>
              <Ionicons name="time-outline" size={16} color="#92400E" />
              <Text style={[styles.paymentText, { color: '#92400E' }]}>
                Payment pending from devotee
              </Text>
            </View>
          )}
        </View>

        {/* Action: Mark Complete (only for confirmed + paid bookings) */}
        {(booking as any).status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.completeBtn, (isCompleting || !isPaid) && styles.disabledBtn]}
            onPress={handleMarkComplete}
            disabled={isCompleting || !isPaid}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.completeBtnText}>
                  {isPaid ? 'Mark as Completed' : 'Awaiting payment'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background, position: 'relative' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  paymentPending: { backgroundColor: '#FEF3C7' },
  paymentPaid: { backgroundColor: '#DCFCE7' },
  paymentText: { fontSize: 13, fontWeight: '600' },
  backIcon: { position: 'absolute', left: 16, zIndex: 10, padding: 8 },
  scrollContent: { paddingHorizontal: 16 },
  screenTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  cardTitle: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.md,
  },
  devoteeRow: { flexDirection: 'row', alignItems: 'center' },
  devoteeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devoteeInfo: { marginLeft: 12 },
  devoteeName: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  devoteeSubtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  infoText: { marginLeft: 12, flex: 1 },
  infoLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.gold,
  },
  earningsNote: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    marginTop: THEME.spacing.sm,
  },
  completeBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: { opacity: 0.5 },
  errorText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  errorBackBtn: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
  },
  errorBackBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: THEME.typography.body },
});
