// src/components/RatingStars.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_COLORS } from '../constants/Colors';

/**
 * A reusable star rating component
 * @param {Object} props - Component props
 * @param {number} props.rating - Current rating value (0-5)
 * @param {Function} props.onRatingChange - Function to call when rating changes
 * @param {number} props.size - Size of the stars
 * @param {boolean} props.readOnly - Whether the rating can be changed
 * @param {number} props.count - Number of reviews
 * @param {boolean} props.showCount - Whether to show the review count
 * @param {Object} props.style - Additional styles for the container
 */
type Props = {
  rating?: number;
  onRatingChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  count?: number;
  showCount?: boolean;
  style?: any;
};

const RatingStars: React.FC<Props> = ({
  rating = 0,
  onRatingChange,
  size = 20,
  readOnly = false,
  count = 0,
  showCount = false,
  style = {}
}) => {
  // Make sure rating is within 0-5 range
  const validRating = Math.max(0, Math.min(5, rating));

  // Generate array with 5 stars
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const iconName = i <= validRating ? 'star' : 'star-outline';
    stars.push(
      <TouchableOpacity
        key={i}
        disabled={readOnly}
        onPress={() => onRatingChange && onRatingChange(i)}
        style={{ padding: 2 }}
      >
        <Ionicons
          name={iconName}
          size={size}
          color={i <= validRating ? '#FFD700' : APP_COLORS.lightGray}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {stars}
      </View>
      {showCount && (
        <Text style={styles.countText}>
          ({count} {count === 1 ? 'review' : 'reviews'})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  countText: {
    marginLeft: 5,
    fontSize: 14,
    color: APP_COLORS.gray,
  },
});

export default RatingStars;