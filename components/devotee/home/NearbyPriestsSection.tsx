/**
 * NearbyPriestsSection — horizontal scrolling row of PriestCard items.
 * When location is denied it renders a disabled state with a prompt.
 */

import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NearbyPriest } from '@/types/home.types';
import PriestCard from './PriestCard';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface LocationBlockedProps {
  onRequestLocation: () => void;
}

/**
 * Renders the location-denied placeholder with a "Set location" CTA.
 */
function LocationBlocked({ onRequestLocation }: LocationBlockedProps): React.JSX.Element {
  return (
    <View style={styles.blockedContainer}>
      <Ionicons name="location-outline" size={36} color={THEME.colors.textMuted} />
      <Text style={styles.blockedTitle}>Location needed</Text>
      <Text style={styles.blockedBody}>
        Allow location access to see pandits near you.
      </Text>
      <TouchableOpacity
        style={styles.setLocationBtn}
        onPress={onRequestLocation}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Enable location access"
      >
        <Text style={styles.setLocationText}>Set location</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface NearbyPriestsSectionProps {
  priests: NearbyPriest[];
  locationGranted: boolean;
  onRequestLocation: () => void;
}

/**
 * Horizontally scrollable priest list. Falls back to location-prompt when
 * permission has not been granted.
 */
export default function NearbyPriestsSection({
  priests,
  locationGranted,
  onRequestLocation,
}: NearbyPriestsSectionProps): React.JSX.Element {
  if (!locationGranted) {
    return <LocationBlocked onRequestLocation={onRequestLocation} />;
  }

  if (priests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pandits found nearby.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={priests}
      keyExtractor={(p) => p._id}
      renderItem={({ item }) => <PriestCard priest={item} />}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  listContent: {
    paddingRight: THEME.spacing.md,
  },
  blockedContainer: {
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  blockedTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.sm,
  },
  blockedBody: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  setLocationBtn: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
  },
  setLocationText: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  emptyContainer: {
    paddingVertical: THEME.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});
