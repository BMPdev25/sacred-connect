/**
 * SegmentedControl — equal-width option picker for the Minimum Rating filter.
 * Selected segment: saffron background + white text.
 * Unselected segment: transparent + textSecondary.
 * Container: grey surface with padding and rounded corners.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTAINER_PADDING = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SegmentOption {
  /** Display label shown inside the segment. */
  label: string;
  /** Underlying value dispatched on selection; null means "Any". */
  value: number | null;
}

interface SegmentedControlProps {
  /** Array of segment options to render. */
  options: SegmentOption[];
  /** The currently selected value (null = 'Any'). */
  selectedValue: number | null;
  /** Called when a segment is tapped. */
  onChange: (value: number | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Horizontally distributed segmented picker for rating selection.
 */
export function SegmentedControl({
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = opt.value === selectedValue;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.segmentLabel,
                isActive ? styles.segmentLabelActive : styles.segmentLabelInactive,
              ]}
            >
              {opt.label}
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
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: CONTAINER_PADDING,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
  },
  segmentActive: {
    backgroundColor: THEME.colors.primary,
  },
  segmentLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: THEME.colors.surface,
  },
  segmentLabelInactive: {
    color: THEME.colors.textSecondary,
  },
});
