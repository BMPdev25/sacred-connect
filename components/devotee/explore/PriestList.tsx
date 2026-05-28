/**
 * PriestList — paginated FlatList of pandit cards for the Explore Tab.
 * Shows an animated skeleton during initial load, a spinner while fetching
 * the next page, and an end-of-list message when all results are displayed.
 */

import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NearbyPriest } from '@/types/home.types';
import { THEME } from '@/constants/theme';
import PanditCard from './PanditCard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 5;
const SKELETON_HEIGHT = 100;
const SEPARATOR_HEIGHT = 12;
const END_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for PriestList. */
export interface PriestListProps {
  /** Flattened array of priests from all loaded pages. */
  priests: NearbyPriest[];
  /** True during the initial fetch (no data yet). */
  isLoading: boolean;
  /** True while an additional page is being fetched. */
  isFetchingNextPage: boolean;
  /** True when a next page exists and can be loaded. */
  hasNextPage: boolean;
  /** Called when the list scrolls near the end. */
  onEndReached: () => void;
  /** Called when a priest card is tapped. */
  onPriestPress: (priestId: string) => void;
  /** Total result count for the label above the list. */
  resultCount: number;
  /** True when the user has an active text search query. */
  isSearchActive: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Animated pulsing skeleton placeholder for a single priest card row.
 */
function SkeletonCard(): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]} />
  );
}

interface ListFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  priestCount: number;
}

/**
 * Renders a loading spinner or end-of-list message at the bottom of the list.
 */
function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  priestCount,
}: ListFooterProps): React.JSX.Element | null {
  if (isFetchingNextPage) {
    return (
      <ActivityIndicator
        color={THEME.colors.primary}
        style={styles.pageSpinner}
      />
    );
  }
  if (!hasNextPage && priestCount > 0) {
    return (
      <Text style={styles.endLabel}>You've seen all available pandits</Text>
    );
  }
  return null;
}

interface ResultCountRowProps {
  count: number;
  isSearchActive: boolean;
}

/**
 * Small label showing how many results are available above the list.
 */
function ResultCountRow({ count, isSearchActive }: ResultCountRowProps): React.JSX.Element {
  const label = isSearchActive
    ? `${count} results found`
    : `${count} pandits available near you`;
  return <Text style={styles.resultCount}>{label}</Text>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the paginated explore priest list with skeleton loading states.
 */
export default function PriestList({
  priests,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  onPriestPress,
  resultCount,
  isSearchActive,
}: PriestListProps): React.JSX.Element {
  // Initial loading — show skeleton cards
  if (isLoading && priests.length === 0) {
    return (
      <View>
        <ResultCountRow count={0} isSearchActive={isSearchActive} />
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <View key={i} style={styles.skeletonWrap}>
            <SkeletonCard />
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={priests}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <ResultCountRow count={resultCount} isSearchActive={isSearchActive} />
      }
      renderItem={({ item }) => (
        <PanditCard priest={item} onPress={() => onPriestPress(item._id)} />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={END_THRESHOLD}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          priestCount={priests.length}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: THEME.spacing.md,
  },
  skeletonWrap: {
    paddingHorizontal: THEME.spacing.md,
    marginBottom: SEPARATOR_HEIGHT,
  },
  skeletonCard: {
    width: '100%',
    height: SKELETON_HEIGHT,
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
  },
  resultCount: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  pageSpinner: {
    marginVertical: THEME.spacing.lg,
  },
  endLabel: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginVertical: THEME.spacing.xl,
  },
});
