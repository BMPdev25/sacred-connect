/**
 * HomeSkeleton — pulsing placeholder displayed while HomeTab data loads for
 * the very first time (no cached data in React Query).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helper — single animated skeleton block
// ---------------------------------------------------------------------------

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

/**
 * A single gray pulsing rectangle used as a loading placeholder.
 */
function SkeletonBox({ width, height, borderRadius = 8, style }: SkeletonBoxProps): React.JSX.Element {
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
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Main skeleton layout
// ---------------------------------------------------------------------------

/**
 * Full-page skeleton that mirrors the HomeTab layout during initial fetch.
 */
export default function HomeSkeleton(): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width="50%" height={20} />
        <SkeletonBox width="35%" height={14} style={styles.mt8} />
      </View>

      {/* Banner */}
      <SkeletonBox width="100%" height={180} borderRadius={THEME.borderRadius.lg} style={styles.section} />

      {/* Category chips */}
      <View style={styles.chipRow}>
        {[80, 90, 70, 85, 75].map((w, i) => (
          <SkeletonBox key={i} width={w} height={36} borderRadius={THEME.borderRadius.pill} style={styles.chip} />
        ))}
      </View>

      {/* Section label */}
      <SkeletonBox width="45%" height={16} style={styles.sectionLabel} />

      {/* Priest cards */}
      <View style={styles.priestRow}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.priestCard}>
            <SkeletonBox width="100%" height={120} borderRadius={THEME.borderRadius.md} />
            <SkeletonBox width="70%" height={14} style={styles.mt8} />
            <SkeletonBox width="50%" height={12} style={styles.mt8} />
          </View>
        ))}
      </View>

      {/* Section label */}
      <SkeletonBox width="40%" height={16} style={styles.sectionLabel} />

      {/* Festival rows */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.festivalRow}>
          <SkeletonBox width={52} height={60} borderRadius={THEME.borderRadius.sm} />
          <View style={styles.festivalText}>
            <SkeletonBox width="60%" height={14} />
            <SkeletonBox width="45%" height={12} style={styles.mt8} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  box: {
    backgroundColor: THEME.colors.border,
  },
  header: {
    marginBottom: THEME.spacing.md,
  },
  section: {
    marginBottom: THEME.spacing.md,
  },
  mt8: {
    marginTop: THEME.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
  },
  chip: {
    marginRight: THEME.spacing.sm,
  },
  sectionLabel: {
    marginBottom: THEME.spacing.sm,
  },
  priestRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  priestCard: {
    flex: 1,
  },
  festivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  festivalText: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
});
