import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InteractiveStarProps {
  filled: boolean;
  size: number;
  onPress: () => void;
}

export function InteractiveStar({ filled, size, onPress }: InteractiveStarProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={size}
          color={filled ? '#F59E0B' : '#D1D5DB'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
