import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEME } from '@/constants/theme';

export function BookingCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      {/* Block for Title/Badge */}
      <View style={styles.skeletonRowBetween}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>

      {/* Block for Priest */}
      <View style={styles.skeletonRowStart}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTextMedium} />
      </View>

      {/* Block for Date/Time */}
      <View style={styles.skeletonRowStart}>
        <View style={styles.skeletonTextSmall} />
        <View style={styles.skeletonTextSmall} />
      </View>

      <View style={styles.skeletonDivider} />

      {/* Block for Price/Action */}
      <View style={styles.skeletonRowBetween}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  skeletonRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonRowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.md,
  },
  skeletonTitle: {
    height: 20,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 24,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  skeletonTextMedium: {
    height: 16,
    width: '30%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTextSmall: {
    height: 14,
    width: '20%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginTop: 12,
    marginBottom: 12,
  },
  skeletonBtn: {
    height: 36,
    width: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: THEME.borderRadius.pill,
  },
});
