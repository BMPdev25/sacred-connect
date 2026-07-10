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
import { useDispatch } from 'react-redux';

import { THEME } from '@/constants/theme';
import { PriestRequestsService } from '@/services/priest/priestRequestsService';
import { decrementPendingRequests } from '@/redux/slices/priestDashboardSlice';
import { formatDisplayDate, formatTime12Hour } from '@/utils/bookingUtils';

/** Duration label from minutes. */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/** Single info row with an icon, a label and a value. */
function DetailRow({
  iconName,
  label,
  value,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={iconName} size={20} color={THEME.colors.primary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * RequestDetails screen — shows full details of a single pending booking request.
 * The priest can accept or decline from here.
 */
export default function RequestDetails(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['priestRequestDetail', bookingId],
    queryFn: () => PriestRequestsService.fetchRequestDetail(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });

  const handleAccept = async () => {
    if (!bookingId) return;
    setIsAccepting(true);
    try {
      await PriestRequestsService.acceptRequest(bookingId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['priestCalendarBookings'] });
      queryClient.invalidateQueries({ queryKey: ['priestEarnings'] });
      dispatch(decrementPendingRequests());
      Alert.alert('Accepted 🎉', 'The devotee has been notified.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept booking');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    if (!bookingId) return;
    Alert.alert('Decline Request?', 'The devotee will be notified.', [
      { text: 'Keep Request', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setIsDeclining(true);
          try {
            await PriestRequestsService.declineRequest(bookingId);
            queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
            dispatch(decrementPendingRequests());
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to decline');
          } finally {
            setIsDeclining(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (isError || !request) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.textMuted} />
        <Text style={styles.errorText}>Unable to load request details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProcessing = isAccepting || isDeclining;

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
        <Text style={styles.screenTitle}>Booking Request</Text>

        {/* Devotee info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>From</Text>
          <Text style={styles.devoteeName}>{request.devoteeId?.name ?? 'Devotee unavailable'}</Text>
          {request.devoteeId?.createdAt && (
            <Text style={styles.devoteeJoined}>
              Member since{' '}
              {new Date(request.devoteeId.createdAt).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Ceremony details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ceremony Details</Text>
          <DetailRow
            iconName="pricetag-outline"
            label="Ceremony"
            value={request.ceremonyType}
          />
          <DetailRow
            iconName="calendar-outline"
            label="Date"
            value={formatDisplayDate(request.date)}
          />
          <DetailRow
            iconName="time-outline"
            label="Time"
            value={`${formatTime12Hour(request.startTime)} – ${formatTime12Hour(request.endTime)}`}
          />
          {request.durationMinutes > 0 && (
            <DetailRow
              iconName="hourglass-outline"
              label="Duration"
              value={formatDuration(request.durationMinutes)}
            />
          )}
          <DetailRow
            iconName="location-outline"
            label="Location"
            value={request.location.address}
          />
          {request.distance != null && (
            <DetailRow
              iconName="navigate-outline"
              label="Distance"
              value={`${request.distance} km away`}
            />
          )}
        </View>

        {/* Earnings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Earnings</Text>
          <Text style={styles.earningsAmount}>
            ₹{request.basePrice.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.earningsNote}>Base price (platform fee already deducted)</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.declineBtn, isProcessing && styles.disabledBtn]}
            onPress={handleDecline}
            disabled={isProcessing}
          >
            {isDeclining ? (
              <ActivityIndicator size="small" color={THEME.colors.error} />
            ) : (
              <Text style={styles.declineBtnText}>Decline</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, isProcessing && styles.disabledBtn]}
            onPress={handleAccept}
            disabled={isProcessing}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background, position: 'relative' },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  devoteeName: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  devoteeJoined: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailText: { marginLeft: 12, flex: 1 },
  detailLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
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
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: THEME.spacing.sm },
  declineBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.error,
  },
  acceptBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
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
  backBtn: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
  },
  backBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: THEME.typography.body },
});
