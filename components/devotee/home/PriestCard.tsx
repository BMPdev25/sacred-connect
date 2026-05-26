/**
 * PriestCard — compact card showing a nearby pandit's key details.
 * Used in the horizontal scroll section on the HomeTab.
 */

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NearbyPriest } from '@/types/home.types';
import { AssetService } from '@/services/assets/AssetService';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_WIDTH = 160;
const PHOTO_HEIGHT = 110;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RatingBadgeProps {
  rating: number;
}

/**
 * Small star-rating badge shown over the photo.
 */
function RatingBadge({ rating }: RatingBadgeProps): React.JSX.Element {
  return (
    <View style={styles.ratingBadge}>
      <Ionicons name="star" size={10} color="#FFD700" />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PriestCardProps {
  priest: NearbyPriest;
  onPress?: () => void;
}

/**
 * Compact priest card displaying photo, name, specialization, rating, and price.
 * Falls back to avatar placeholder when profilePicture is absent.
 */
export default function PriestCard({ priest, onPress }: PriestCardProps): React.JSX.Element {
  const imageSource = priest.profilePicture
    ? { uri: priest.profilePicture }
    : AssetService.getImage('shared.avatarPlaceholder');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`View ${priest.name}'s profile`}
      accessibilityRole="button"
    >
      <View style={styles.photoWrapper}>
        <Image source={imageSource} style={styles.photo} resizeMode="cover" />
        <RatingBadge rating={priest.rating} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{priest.name}</Text>
        <Text style={styles.specialization} numberOfLines={1}>
          {priest.primarySpecialization}
        </Text>
        <Text style={styles.price}>
          From ₹{priest.startingPrice.toLocaleString('en-IN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginRight: THEME.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  photoWrapper: {
    width: CARD_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.surface,
  },
  info: {
    padding: THEME.spacing.sm,
  },
  name: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  price: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});
