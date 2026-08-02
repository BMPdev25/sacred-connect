import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { BookingListItem } from '@/types/bookingManagement.types';
import { getBookingCardDisplay, formatBookingDateTime } from '@/utils/bookingCardUtils';
import { getProfilePicSource } from '@/utils/imageUtils';

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function IconLabel({
  iconName,
  label,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.iconLabelWrap}>
      <Ionicons name={iconName} size={14} color={THEME.colors.primary} />
      <Text style={styles.iconLabelText}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface BookingCardProps {
  booking: BookingListItem;
  onPress: (bookingId: string) => void;
  onActionPress: (booking: BookingListItem) => void;
}

export function BookingCard({ booking, onPress, onActionPress }: BookingCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const display = getBookingCardDisplay(booking.status);
  const { dateDisplay, timeDisplay } = formatBookingDateTime(booking.date, booking.startTime);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.99,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const profileSource = getProfilePicSource(booking.priestId?.profilePicture);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => onPress(booking._id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardInner}
      >
        {/* ROW 1 — Title + Badge */}
        <View style={styles.row1}>
          <Text style={styles.ceremonyTitle} numberOfLines={1}>
            {booking.ceremonyType}
          </Text>
          <View style={[styles.badge, { backgroundColor: display.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: display.badgeTextColor }]}>
              {display.badgeLabel}
            </Text>
          </View>
        </View>

        {/* ROW 2 — Priest */}
        <View style={styles.row2}>
          <Image source={profileSource as any} style={styles.priestAvatar} />
          <Text style={styles.priestName} numberOfLines={1}>
            {booking.priestId?.name ?? 'Unknown Priest'}
          </Text>
        </View>

        {/* ROW 3 — Date/Time */}
        <View style={styles.row3}>
          <IconLabel iconName="calendar-outline" label={dateDisplay} />
          <IconLabel iconName="time-outline" label={timeDisplay} />
        </View>

        <View style={styles.divider} />

        {/* ROW 4 — Price + Action */}
        <View style={styles.row4}>
          <Text style={styles.priceText}>
            ₹{booking.totalAmount.toLocaleString('en-IN')}
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onActionPress(booking)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>{display.actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardInner: {
    padding: THEME.spacing.md,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ceremonyTitle: {
    flex: 1,
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginRight: THEME.spacing.sm,
  },
  badge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: THEME.typography.caption,
    fontWeight: '600',
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  priestAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.background,
  },
  priestName: {
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
    gap: THEME.spacing.md,
  },
  iconLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconLabelText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginTop: 12,
    marginBottom: 12,
  },
  row4: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  actionBtn: {
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  actionBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});
