/**
 * PanditCard — full-width vertical card used in the Explore Tab priest list.
 * Shows photo thumbnail, name, specialization, rating, review count,
 * experience years, distance (when available), and starting price.
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NearbyPriest } from '@/types/home.types';
import { AssetService } from '@/services/assets/AssetService';
import { THEME } from '@/constants/theme';
import { StarDisplay } from '@/components/shared/StarDisplay';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHOTO_SIZE = 80;
const STAR_SIZE = 12;
const META_ICON_SIZE = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for PanditCard. */
export interface PanditCardProps {
  /** Priest data to display. */
  priest: NearbyPriest;
  /** Called when the card is tapped. */
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MetaRowProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}

/**
 * Small icon + text pair used for experience and distance metadata.
 */
function MetaItem({ iconName, label }: MetaRowProps): React.JSX.Element {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={iconName} size={META_ICON_SIZE} color={THEME.colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

interface RatingRowProps {
  rating: number;
  reviewCount: number;
}

/**
 * Star icon + numeric rating + review count.
 */
function RatingRow({ rating, reviewCount }: RatingRowProps): React.JSX.Element {
  return (
    <View style={styles.ratingRow}>
      <StarDisplay rating={rating} size={STAR_SIZE} color={THEME.colors.gold} />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      <Text style={styles.reviewCount}>{`(${reviewCount})`}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Full-width pandit card for the Explore priest list.
 */
export default function PanditCard({
  priest,
  onPress,
}: PanditCardProps): React.JSX.Element {
  const imageSource = priest.profilePicture
    ? { uri: priest.profilePicture }
    : AssetService.getImage('shared.avatarPlaceholder');

  const distanceLabel = typeof priest.distance === 'number'
    ? `${priest.distance.toFixed(1)} km away`
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View ${priest.name}'s profile`}
    >
      <Image source={imageSource} style={styles.photo} resizeMode="cover" />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{priest.name}</Text>
        <Text style={styles.specialization} numberOfLines={1}>
          {priest.primarySpecialization}
        </Text>

        <RatingRow rating={priest.rating} reviewCount={priest.reviewCount} />

        <View style={styles.metaRow}>
          <MetaItem
            iconName="time-outline"
            label={`${priest.experienceYears} yrs exp`}
          />
          {distanceLabel !== null && (
            <MetaItem iconName="location-outline" label={distanceLabel} />
          )}
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.priceFrom}>From</Text>
        <Text style={styles.price}>
          {`₹${priest.startingPrice.toLocaleString('en-IN')}`}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.border,
  },
  info: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  name: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  specialization: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  ratingText: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  reviewCount: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  metaLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceFrom: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  price: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
