/**
 * SortChips — horizontal scrollable row of sort-option pills for the Explore Tab.
 * Selected chip: saffron background, white text.
 * Unselected chip: white background, grey border, primary text.
 */

import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { SortOption } from '@/types/explore.types';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHIP_HEIGHT = 36;
const CHIP_PADDING_H = 16;
const CHIP_BORDER_WIDTH = 1;

interface SortChipItem {
  label: string;
  value: SortOption;
}

const SORT_OPTIONS: SortChipItem[] = [
  { label: 'Top Rated', value: 'rating' },
  { label: 'Nearest',   value: 'distance' },
  { label: 'Price: Low',  value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for SortChips. */
export interface SortChipsProps {
  /** Currently active sort value. */
  selectedSort: SortOption;
  /** Called when a chip is tapped. */
  onSortChange: (sort: SortOption) => void;
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

interface ChipProps {
  item: SortChipItem;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Individual sort option pill chip.
 */
function SortChip({ item, isSelected, onPress }: ChipProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.label}
    >
      <Text
        style={[
          styles.chipLabel,
          isSelected ? styles.chipLabelSelected : styles.chipLabelUnselected,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Horizontally scrollable row of sort option chips for the Explore Tab.
 */
export default function SortChips({
  selectedSort,
  onSortChange,
}: SortChipsProps): React.JSX.Element {
  return (
    <FlatList
      data={SORT_OPTIONS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.value}
      contentContainerStyle={styles.contentContainer}
      renderItem={({ item }) => (
        <SortChip
          item={item}
          isSelected={item.value === selectedSort}
          onPress={() => onSortChange(item.value)}
        />
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  chip: {
    height: CHIP_HEIGHT,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: CHIP_PADDING_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
  },
  chipUnselected: {
    backgroundColor: THEME.colors.surface,
    borderWidth: CHIP_BORDER_WIDTH,
    borderColor: THEME.colors.border,
  },
  chipLabel: {
    fontSize: THEME.typography.body,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: THEME.colors.surface,
  },
  chipLabelUnselected: {
    color: THEME.colors.textPrimary,
  },
});
