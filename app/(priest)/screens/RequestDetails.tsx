import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { StarDisplay } from '@/components/shared/StarDisplay';
import { PriestRequestsService } from '@/services/priest/priestRequestsService';
import { decrementPendingRequests } from '@/redux/slices/priestDashboardSlice';
import { formatTime12Hour, formatDisplayDate } from '@/utils/bookingUtils';
import { formatDuration } from '@/utils/priestDetailsUtils';
import { formatRequestExpiry, isFirstTimeDevotee } from '@/utils/priestUtils';
import { formatMemberSince, formatDistance } from '@/utils/requestDetailsUtils';
import { AssetService } from '@/services/assets/AssetService';

export default function RequestDetails(): React.JSX.Element {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['requestDetail', bookingId],
    queryFn: () => PriestRequestsService.fetchRequestDetail(bookingId!),
    staleTime: 0,
    enabled: !!bookingId,
  });

  const handleAccept = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    try {
      await PriestRequestsService.acceptRequest(bookingId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      dispatch(decrementPendingRequests());
      router.back();
      // Toast can be added here
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('no longer available')) {
        Alert.alert('Too Late', 'This request was already taken or expired.');
        router.back();
      } else {
        Alert.alert('Error', error.message || 'Failed to accept booking');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDecline = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    try {
      await PriestRequestsService.declineRequest(bookingId);
      queryClient.invalidateQueries({ queryKey: ['priestPendingRequests'] });
      dispatch(decrementPendingRequests());
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      'The devotee will be notified that you\'re unavailable.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: confirmDecline },
      ]
    );
  };

  if (isLoading || !request) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
        </TouchableOpacity>
        <View style={{ paddingTop: insets.top + 56 }}>
          <Text style={styles.screenTitle}>Booking Request</Text>
          {/* Basic Skeleton */}
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCardLarge} />
        </View>
      </View>
    );
  }

  const expiryText = formatRequestExpiry(request.createdAt);
  const isExpired = expiryText === 'Expired';
  const buttonsDisabled = isProcessing || isExpired;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
            paddingBottom: 20,
          },
        ]}
      >
        <Text style={styles.screenTitle}>Booking Request</Text>
        {/* DEVOTEE CARD */}
        <View style={styles.devoteeCard}>
          <Image
            source={
              request.devoteeId?.profilePicture
                ? { uri: request.devoteeId.profilePicture }
                : (AssetService.getImage('shared.placeholderAvatar') as any)
            }
            style={styles.avatar}
          />
          <View style={styles.devoteeInfo}>
            <Text style={styles.devoteeName}>{request.devoteeId?.name || 'Devotee'}</Text>
            <Text style={styles.memberSince}>
              Member since {formatMemberSince(request.devoteeId?.createdAt || '')}
            </Text>
            
            <View style={styles.ratingRow}>
              {/* Note: StarDisplay props might vary, using rating & size as requested */}
              <StarDisplay rating={5.0} size={14} />
              <Text style={styles.ratingText}>5.0</Text>
              
              {isFirstTimeDevotee(request.devoteeId?.createdAt || '') && (
                <View style={styles.firstBookingBadge}>
                  <Text style={styles.firstBookingText}>FIRST BOOKING</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* CEREMONY DETAILS CARD */}
        <View style={styles.ceremonyCard}>
          <Text style={styles.sectionTitle}>Ceremony Details</Text>
          <Text style={styles.ceremonyName}>{request.ceremonyType}</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={18} color={THEME.colors.primary} />
            <Text style={styles.detailText}>{formatDisplayDate(request.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color={THEME.colors.primary} />
            <Text style={styles.detailText}>
              {formatTime12Hour(request.startTime)} – {formatTime12Hour(request.endTime)} ({formatDuration(request.durationMinutes || 0)})
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color={THEME.colors.primary} />
            <Text style={styles.detailText} numberOfLines={2}>
              {request.location?.address}
            </Text>
          </View>

          {request.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={14} color={THEME.colors.textMuted} />
              <Text style={styles.distanceText}>
                {formatDistance(request.distance)} from your location
              </Text>
            </View>
          )}
        </View>

        {/* EARNINGS CARD */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsCaption}>YOUR EARNINGS</Text>
          <Text style={styles.earningsAmount}>
            ₹{(request.basePrice || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.earningsSubtext}>
            For {formatDuration(request.durationMinutes || 0)} of service
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={14} color={THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.infoText}>Sacred Connect facilitates payment on your behalf</Text>
          </View>
        </View>
      </ScrollView>

      {/* ACTION SECTION */}
      <View style={[styles.actionSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          title="Accept Booking"
          onPress={handleAccept}
          loading={isProcessing}
          disabled={buttonsDisabled}
          style={{ marginBottom: 12 }}
        />
        
        <TouchableOpacity
          style={[styles.declineButton, buttonsDisabled && { opacity: 0.5 }]}
          onPress={handleDecline}
          disabled={buttonsDisabled}
        >
          <Text style={styles.declineButtonText}>Decline Request</Text>
        </TouchableOpacity>

        <Text style={[styles.expiryText, isExpired && styles.expiredErrorText]}>
          {isExpired ? 'This request has expired' : expiryText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  screenTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Scroll content layout
  },
  
  // Skeleton
  skeletonCard: {
    backgroundColor: '#E5E7EB',
    height: 100,
    margin: 16,
    borderRadius: 16,
  },
  skeletonCardLarge: {
    backgroundColor: '#E5E7EB',
    height: 250,
    marginHorizontal: 16,
    borderRadius: 16,
  },

  // Devotee Card
  devoteeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  devoteeInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  devoteeName: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  memberSince: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: THEME.typography.bodySmall,
    color: '#D4AF37', // gold
    marginLeft: 4,
    fontWeight: '600',
  },
  firstBookingBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    marginLeft: 8,
  },
  firstBookingText: {
    color: '#16A34A',
    fontSize: THEME.typography.caption,
    fontWeight: '700',
  },

  // Ceremony Details Card
  ceremonyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  ceremonyName: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30, // Indented under location
    marginTop: -4,
  },
  distanceText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginLeft: 6,
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  earningsCaption: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.textMuted,
    letterSpacing: 2,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#D4AF37', // gold
  },
  earningsSubtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.md,
    borderStyle: 'dashed',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  declineButton: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: THEME.borderRadius.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: THEME.typography.body,
    color: '#EF4444',
    fontWeight: '600',
  },
  expiryText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  expiredErrorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
