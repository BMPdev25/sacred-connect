/**
 * PriceRangeSlider — dual-handle price filter section for FilterBottomSheet.
 * Displays the selected range numerically and renders range endpoint labels.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PriceRangeSliderProps {
  /** Current lower bound of the price range. */
  minPrice: number;
  /** Current upper bound of the price range. */
  maxPrice: number;
  /** Called when either handle moves; provides new [min, max] pair. */
  onChange: (min: number, max: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a rupee value to en-IN locale string (e.g. 1,500).
 */
function formatRupee(value: number): string {
  return value.toLocaleString('en-IN');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Dual-handle slider letting the user pick a min/max service price range.
 */
export function PriceRangeSlider({
  minPrice,
  maxPrice,
  onChange,
}: PriceRangeSliderProps): React.JSX.Element {
  const [localValues, setLocalValues] = React.useState<number[]>([minPrice, maxPrice]);

  React.useEffect(() => {
    setLocalValues([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  function handleChange(values: number | number[]): void {
    const arr = Array.isArray(values) ? values : [values, values];
    setLocalValues([Math.round(arr[0]), Math.round(arr[1])]);
  }

  function handleSlidingComplete(values: number | number[]): void {
    const arr = Array.isArray(values) ? values : [values, values];
    onChange(Math.round(arr[0]), Math.round(arr[1]));
  }

  return (
    <View>
      <Text style={styles.valueLabel}>
        {`₹${formatRupee(localValues[0])} – ₹${formatRupee(localValues[1])}`}
      </Text>

      <Slider
        minimumValue={PRICE_MIN}
        maximumValue={PRICE_MAX}
        step={PRICE_STEP}
        value={localValues}
        onValueChange={handleChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={THEME.colors.primary}
        maximumTrackTintColor={THEME.colors.border}
        thumbTintColor={THEME.colors.primary}
      />

      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>₹0</Text>
        <Text style={styles.rangeLabel}>₹10,000</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  valueLabel: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.xs,
  },
  rangeLabel: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});
