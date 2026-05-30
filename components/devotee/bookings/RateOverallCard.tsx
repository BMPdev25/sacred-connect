import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { THEME } from '@/constants/theme';
import { StarRatingRow } from './StarRatingRow';

const RATING_LABEL_MAP: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

function getRatingColor(rating: number) {
  if (rating >= 4) return THEME.colors.gold;
  if (rating >= 3) return THEME.colors.primary;
  return THEME.colors.error;
}

interface RateOverallCardProps {
  overallRating: number;
  setOverallRating: (val: number) => void;
}

/**
 * RateOverallCard displays overall experience rating options with labels and animations.
 *
 * @param props.overallRating - Current selected overall rating.
 * @param props.setOverallRating - Rating changed callback.
 */
export function RateOverallCard({
  overallRating,
  setOverallRating,
}: RateOverallCardProps): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (overallRating > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [overallRating, pulseAnim]);

  return (
    <View style={styles.overallCard}>
      <Text style={styles.overallTitle}>Overall Experience</Text>
      <StarRatingRow value={overallRating} onChange={setOverallRating} size={44} />
      
      <Animated.View style={[styles.ratingLabelContainer, { transform: [{ scale: pulseAnim }] }]}>
        {overallRating > 0 && (
          <Text style={[styles.ratingLabelText, { color: getRatingColor(overallRating) }]}>
            {RATING_LABEL_MAP[overallRating]}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overallCard: {
    backgroundColor: THEME.colors.surface,
    ...THEME.shadow.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  overallTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    height: 24,
  },
  ratingLabelText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
  },
});
