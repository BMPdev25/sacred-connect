/**
 * DistanceSlider — single-handle maximum-distance filter section.
 * Displays the selected distance numerically and renders range endpoint labels.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISTANCE_MIN = 5;
const DISTANCE_MAX = 50;
const DISTANCE_STEP = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DistanceSliderProps {
  /** Currently selected maximum distance in kilometres. */
  maxDistanceKm: number;
  /** Called when the slider handle moves. */
  onChange: (km: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Single-handle slider for the maximum service-area distance filter.
 */
export function DistanceSlider({
  maxDistanceKm,
  onChange,
}: DistanceSliderProps): React.JSX.Element {
  const [localDistance, setLocalDistance] = React.useState<number>(maxDistanceKm);

  React.useEffect(() => {
    setLocalDistance(maxDistanceKm);
  }, [maxDistanceKm]);

  function handleChange(values: number | number[]): void {
    const raw = Array.isArray(values) ? values[0] : values;
    setLocalDistance(Math.round(raw));
  }

  function handleSlidingComplete(values: number | number[]): void {
    const raw = Array.isArray(values) ? values[0] : values;
    onChange(Math.round(raw));
  }

  return (
    <View>
      <Text style={styles.valueLabel}>{`Up to ${localDistance} km`}</Text>

      <Slider
        minimumValue={DISTANCE_MIN}
        maximumValue={DISTANCE_MAX}
        step={DISTANCE_STEP}
        value={localDistance}
        onValueChange={handleChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={THEME.colors.primary}
        maximumTrackTintColor={THEME.colors.border}
        thumbTintColor={THEME.colors.primary}
      />

      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>5 km</Text>
        <Text style={styles.rangeLabel}>50 km</Text>
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
