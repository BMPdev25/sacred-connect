import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { InteractiveStar } from './InteractiveStar';

interface StarRatingRowProps {
  value: number;
  onChange: (value: number) => void;
  size: number;
  label?: string;
}

export function StarRatingRow({ value, onChange, size, label }: StarRatingRowProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.starsRow, !label && { justifyContent: 'center', width: '100%' }]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <InteractiveStar
            key={index}
            filled={index < value}
            size={size}
            onPress={() => onChange(index + 1)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
