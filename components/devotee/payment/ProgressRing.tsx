import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { THEME } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** The formatted display total price in Rupees (e.g. "1,500"). */
  totalDisplay: string;
}

/**
 * Animated circular loading indicator with the total price displayed in the center.
 */
export default function ProgressRing({ totalDisplay }: ProgressRingProps): React.ReactElement {
  const animVal = useRef(new Animated.Value(0)).current;
  const radius = 60;
  const strokeWidth = 4;
  const size = 140;
  const circumference = 2 * Math.PI * radius; // Approx 377

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animVal, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(animVal, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animVal]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * 0.15],
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={THEME.colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={THEME.colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>₹{totalDisplay}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  priceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.gold,
    textAlign: 'center',
  },
});
