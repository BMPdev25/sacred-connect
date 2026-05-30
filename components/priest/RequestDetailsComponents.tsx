import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { StarDisplay } from '@/components/shared/StarDisplay';
import { AssetService } from '@/services/assets/AssetService';
import { formatTime12Hour, formatDisplayDate } from '@/utils/bookingUtils';
import { formatDuration } from '@/utils/priestDetailsUtils';
import { isFirstTimeDevotee } from '@/utils/priestUtils';
import { formatMemberSince, formatDistance } from '@/utils/requestDetailsUtils';

interface RequestDevoteeCardProps {
  devotee: {
    profilePicture?: string;
    name?: string;
    createdAt?: string;
  } | null;
}

/**
 * Subcomponent rendering the Devotee card for a request.
 */
export function RequestDevoteeCard({ devotee }: RequestDevoteeCardProps): React.JSX.Element {
  const avatarSource = devotee?.profilePicture
    ? { uri: devotee.profilePicture }
    : (AssetService.getImage('shared.placeholderAvatar') as any);

  const isFirst = devotee?.createdAt 
    ? isFirstTimeDevotee(devotee.createdAt)
    : false;  // if unknown, do not show badge

  return (
    <View style={styles.devoteeCard}>
      <Image source={avatarSource} style={styles.avatar} />
      <View style={styles.devoteeInfo}>
        <Text style={styles.devoteeName}>{devotee?.name || 'Devotee'}</Text>
        <Text style={styles.memberSince}>
          Member since {formatMemberSince(devotee?.createdAt || '')}
        </Text>
        
        <View style={styles.ratingRow}>
          <StarDisplay rating={5.0} size={14} />
          <Text style={styles.ratingText}>5.0</Text>
          
          {isFirst && (
            <View style={styles.firstBookingBadge}>
              <Text style={styles.firstBookingText}>FIRST BOOKING</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

interface RequestCeremonyCardProps {
  ceremonyType: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  address: string;
  distance?: number;
}

/**
 * Subcomponent rendering the Ceremony Details card for a request.
 */
export function RequestCeremonyCard({
  ceremonyType,
  date,
  startTime,
  endTime,
  durationMinutes,
  address,
  distance,
}: RequestCeremonyCardProps): React.JSX.Element {
  return (
    <View style={styles.ceremonyCard}>
      <Text style={styles.sectionTitle}>Ceremony Details</Text>
      <Text style={styles.ceremonyName}>{ceremonyType}</Text>
      
      <View style={styles.detailRow}>
        <Ionicons name="calendar" size={18} color={THEME.colors.primary} />
        <Text style={styles.detailText}>{formatDisplayDate(date)}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="time" size={18} color={THEME.colors.primary} />
        <Text style={styles.detailText}>
          {formatTime12Hour(startTime)} – {formatTime12Hour(endTime)} ({formatDuration(durationMinutes)})
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location" size={18} color={THEME.colors.primary} />
        <Text style={styles.detailText} numberOfLines={2}>
          {address}
        </Text>
      </View>

      {distance !== undefined && (
        <View style={styles.distanceRow}>
          <Ionicons name="location-outline" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.distanceText}>
            {formatDistance(distance)} from your location
          </Text>
        </View>
      )}
    </View>
  );
}

interface RequestEarningsCardProps {
  basePrice: number;
  durationMinutes: number;
}

/**
 * Subcomponent rendering the Earnings card for a request.
 */
export function RequestEarningsCard({
  basePrice,
  durationMinutes,
}: RequestEarningsCardProps): React.JSX.Element {
  return (
    <View style={styles.earningsCard}>
      <Text style={styles.earningsCaption}>YOUR EARNINGS</Text>
      <Text style={styles.earningsAmount}>
        ₹{(basePrice || 0).toLocaleString('en-IN')}
      </Text>
      <Text style={styles.earningsSubtext}>
        For {formatDuration(durationMinutes)} of service
      </Text>
      
      <View style={styles.divider} />
      
      <View style={styles.infoRow}>
        <Ionicons name="information-circle-outline" size={14} color={THEME.colors.textMuted} style={{ marginRight: 4 }} />
        <Text style={styles.infoText}>Sacred Connect facilitates payment on your behalf</Text>
      </View>
    </View>
  );
}

interface RequestDetailsSkeletonProps {
  onBack: () => void;
  topInset: number;
}

/**
 * Subcomponent rendering the skeleton loader UI for RequestDetails.
 */
export function RequestDetailsSkeleton({
  onBack,
  topInset,
}: RequestDetailsSkeletonProps): React.JSX.Element {
  return (
    <View style={styles.skeletonContainer}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.skeletonBackBtn, { top: topInset + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.maroon} />
      </TouchableOpacity>
      <View style={{ paddingTop: topInset + 56 }}>
        <Text style={styles.skeletonScreenTitle}>Booking Request</Text>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCardLarge} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#D4AF37',
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
    marginLeft: 30,
    marginTop: -4,
  },
  distanceText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginLeft: 6,
  },
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
    color: '#D4AF37',
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
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  skeletonBackBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  skeletonScreenTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
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
});
