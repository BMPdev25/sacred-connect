/**
 * ExploreEmptyState -- contextual empty state for the Explore Tab.
 * Renders different messaging and CTAs based on why there are no results.
 */

import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_SIZE = 56;
const BUTTON_WIDTH = 180;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Reason codes that determine which empty state variant is shown. */
export type ExploreEmptyReason = 'no_results' | 'no_location' | 'search_empty' | 'error';

/** Props for ExploreEmptyState. */
export interface ExploreEmptyStateProps {
  /** Determines which messaging and CTA to display. */
  reason: ExploreEmptyReason;
  /** Active search query -- used in the search_empty message. */
  searchQuery?: string;
  /** Called when the user taps "Clear Filters" (no_results only). */
  onClearFilters?: () => void;
  /** Called when the user taps "Browse All Pandits" -- resets all filters and search. */
  onBrowseAll?: () => void;
  /** Called when the user taps "Enable Location" (no_location only). */
  onEnableLocation?: () => void;
  /** Called when the user taps "Retry" after an error. */
  onRetry?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface EmptyConfig {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  heading: string;
  body: string;
}

/**
 * Returns the icon, heading, and body copy for the given reason code.
 */
function getConfig(
  reason: ExploreEmptyReason,
  searchQuery: string | undefined
): EmptyConfig {
  switch (reason) {
    case 'no_results':
      return {
        iconName: 'search-outline',
        heading: 'No pandits found',
        body: 'Try adjusting your filters or search differently',
      };
    case 'search_empty':
      return {
        iconName: 'search-outline',
        heading: `No results for "${searchQuery ?? ''}"`,
        body: 'Try different keywords or browse all pandits',
      };
    case 'no_location':
      return {
        iconName: 'location-outline',
        heading: 'Enable location to find pandits near you',
        body: 'We need your location to show pandits in your area',
      };
    case 'error':
      return {
        iconName: 'alert-circle-outline',
        heading: 'Something went wrong',
        body: 'Failed to load available pandits. Please try again.',
      };
  }
}

/**
 * Opens the system settings screen so the user can grant location permission.
 */
async function openSystemSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Fail silently -- nothing actionable if openSettings is unavailable
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Contextual empty state shown in the Explore Tab when no priests are visible.
 */
export default function ExploreEmptyState({
  reason,
  searchQuery,
  onClearFilters,
  onBrowseAll,
  onEnableLocation,
  onRetry,
}: ExploreEmptyStateProps): React.JSX.Element {
  const config = getConfig(reason, searchQuery);

  function handleEnableLocation(): void {
    if (onEnableLocation) {
      onEnableLocation();
    }
    openSystemSettings();
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={config.iconName}
        size={ICON_SIZE}
        color={THEME.colors.textMuted}
      />

      <Text style={styles.heading}>{config.heading}</Text>
      <Text style={styles.body}>{config.body}</Text>

      {reason === 'no_results' && onClearFilters && (
        <View style={styles.buttonWrap}>
          <PrimaryButton
            variant="outline"
            title="Clear Filters"
            onPress={onClearFilters}
          />
        </View>
      )}

      {reason === 'no_results' && onBrowseAll && (
        <View style={styles.buttonWrap}>
          <PrimaryButton
            variant="outline"
            title="Browse All Pandits"
            onPress={onBrowseAll}
          />
        </View>
      )}

      {reason === 'no_location' && (
        <View style={styles.buttonWrap}>
          <PrimaryButton
            variant="outline"
            title="Enable Location"
            onPress={handleEnableLocation}
          />
        </View>
      )}

      {reason === 'error' && onRetry && (
        <View style={styles.buttonWrap}>
          <PrimaryButton
            variant="outline"
            title="Retry"
            onPress={onRetry}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  body: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  buttonWrap: {
    width: BUTTON_WIDTH,
    marginTop: THEME.spacing.lg,
  },
});
