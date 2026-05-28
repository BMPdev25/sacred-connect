/**
 * FilterChip — selectable pill used in ceremony-type and language sections.
 * Selected state: saffron background, white text.
 * Unselected state: white background, grey border, primary text.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHIP_PADDING_H = 14;
const CHIP_PADDING_V = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterChipProps {
  /** Display label rendered inside the chip. */
  label: string;
  /** Whether this chip is in the active/selected state. */
  isSelected: boolean;
  /** Called when the chip is tapped. */
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Pill-shaped toggle chip for filter categories and languages.
 */
export function FilterChip({
  label,
  isSelected,
  onPress,
}: FilterChipProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          isSelected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chip: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: CHIP_PADDING_H,
    paddingVertical: CHIP_PADDING_V,
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
  },
  chipUnselected: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  label: {
    fontSize: THEME.typography.body,
  },
  labelSelected: {
    color: THEME.colors.surface,
    fontWeight: '600',
  },
  labelUnselected: {
    color: THEME.colors.textPrimary,
    fontWeight: '400',
  },
});
