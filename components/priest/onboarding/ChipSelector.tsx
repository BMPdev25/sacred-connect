import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CHIP_PADDING_H, CHIP_PADDING_V } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for ChipSelector component. */
export interface ChipSelectorProps {
  /** All available option strings to display as chips. */
  options: string[];
  /** Currently selected option strings. */
  selected: string[];
  /** Callback when a chip is tapped. Passes the toggled option value. */
  onToggle: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given value is in the selected array.
 */
function isSelected(value: string, selected: string[]): boolean {
  return selected.includes(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a wrapping row of pill-shaped chips.
 * Tapping a chip toggles its selection state via the onToggle callback.
 */
export default function ChipSelector({
  options,
  selected,
  onToggle,
}: ChipSelectorProps): React.ReactElement {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = isSelected(option, selected);
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onToggle(option)}
            style={[styles.chip, active ? styles.chipSelected : styles.chipUnselected]}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active ? styles.chipTextSelected : styles.chipTextUnselected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: CHIP_PADDING_H,
    paddingVertical: CHIP_PADDING_V,
    borderRadius: THEME.borderRadius.pill,
    marginRight: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  chipSelected: {
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    backgroundColor: '#FFF3E0',
  },
  chipUnselected: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  chipText: {
    fontSize: THEME.typography.bodySmall,
  },
  chipTextSelected: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: THEME.colors.textSecondary,
    fontWeight: '400',
  },
});
