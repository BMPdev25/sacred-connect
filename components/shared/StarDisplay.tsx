import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type StarType = 'full' | 'half' | 'empty';

/**
 * Determines the type of star to render based on rating and index.
 * 
 * @param rating - The overall rating (1.0 to 5.0).
 * @param starIndex - The index of the current star (1 to 5).
 * @returns The type of star ('full', 'half', or 'empty').
 */
function getStarType(rating: number, starIndex: number): StarType {
  if (rating >= starIndex) return 'full';
  if (rating >= starIndex - 0.5) return 'half';
  return 'empty';
}

/**
 * Maps the star type to the corresponding Ionicons name.
 * 
 * @param type - The type of star.
 * @returns The Ionicons name.
 */
function getIconName(type: StarType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'full':
      return 'star';
    case 'half':
      return 'star-half';
    case 'empty':
      return 'star-outline';
  }
}

export interface StarDisplayProps {
  /** The overall rating value (1.0 to 5.0) */
  rating: number;
  /** The size of the stars (default: 16) */
  size?: number;
  /** The color of the stars (default: '#F59E0B') */
  color?: string;
}

/**
 * Renders exactly 5 star icons to visually represent a rating.
 */
export function StarDisplay({ rating, size = 16, color = '#F59E0B' }: StarDisplayProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const type = getStarType(rating, starIndex);
        const iconName = getIconName(type);
        return (
          <Ionicons
            key={starIndex}
            name={iconName}
            size={size}
            color={color}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
