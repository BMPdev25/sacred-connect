import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { BookingRequest } from '@/types/priest.dashboard.types';
import { formatTimeAgo, formatTime12Hour, extractCity } from '@/utils/priestUtils';
import { AssetService } from '@/services/assets/AssetService';

interface RequestCardProps {
  request: BookingRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onPress: (requestId: string) => void;
  isNewest: boolean;
  isProcessing?: boolean;
}

export default function RequestCard({
  request,
  onAccept,
  onDecline,
  onPress,
  isNewest,
  isProcessing = false,
}: RequestCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isNewest) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isNewest, pulseAnim]);

  const dateObj = new Date(request.date);
  const dateString = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const city = extractCity(request.location?.address || '');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardContainer}
      onPress={() => onPress(request._id)}
      disabled={isProcessing}
    >
      {isNewest && (
        <Animated.View style={[styles.leftBorder, { opacity: pulseAnim }]} />
      )}

      {/* ROW 1 — Devotee info */}
      <View style={styles.row1}>
        <Image
          source={
            request.devoteeId?.profilePicture
              ? { uri: request.devoteeId.profilePicture }
              : AssetService.getImage('shared.placeholderAvatar') as any
          }
          style={styles.avatar}
        />
        <Text style={styles.devoteeName} numberOfLines={1}>
          {request.devoteeId?.name || 'Devotee'}
        </Text>
        <Text style={styles.timeAgo}>{formatTimeAgo(request.createdAt)}</Text>
      </View>

      {/* ROW 2 — Ceremony */}
      <View style={styles.row2}>
        <Text style={styles.omText}>🕉</Text>
        <Text style={styles.ceremonyType} numberOfLines={1}>
          {request.ceremonyType}
        </Text>
      </View>

      {/* ROW 3 — Date, time */}
      <View style={styles.row3}>
        <Ionicons name="calendar-outline" size={14} color={THEME.colors.primary} />
        <Text style={styles.dateTimeText}>{dateString}</Text>
        <Ionicons name="time-outline" size={14} color={THEME.colors.primary} style={{ marginLeft: 16 }} />
        <Text style={styles.dateTimeText}>{formatTime12Hour(request.startTime)}</Text>
      </View>

      {/* ROW 4 — Location */}
      <View style={styles.row4}>
        <Ionicons name="location-outline" size={14} color={THEME.colors.primary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {request.location?.address ? `${request.location.address}, ${city}` : ''}
        </Text>
      </View>

      {/* EARNINGS BANNER */}
      <View style={styles.earningsBanner}>
        <Text style={styles.earningsLabel}>YOU EARN</Text>
        <Text style={styles.earningsValue}>
          ₹{request.basePrice?.toLocaleString('en-IN') || 0}
        </Text>
      </View>

      {/* BUTTON ROW */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => onDecline(request._id)}
          disabled={isProcessing}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Accept"
            onPress={() => onAccept(request._id)}
            loading={isProcessing}
            disabled={isProcessing}
            style={{ height: 44 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: THEME.colors.primary,
    zIndex: 1,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  devoteeName: {
    flex: 1,
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  timeAgo: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  omText: {
    color: THEME.colors.maroon,
    fontSize: 16,
    marginRight: 8,
  },
  ceremonyType: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  dateTimeText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginLeft: 6,
  },
  row4: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  locationText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  earningsBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsLabel: {
    flex: 1,
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  earningsValue: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: '#D4AF37', // gold
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 44,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: THEME.typography.body,
  },
});
