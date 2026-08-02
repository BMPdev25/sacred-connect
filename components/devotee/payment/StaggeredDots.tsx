import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEME } from '@/constants/theme';

/**
 * Custom hook to generate staggered opacities for the loading dots.
 * Ensures a perfectly aligned 1600ms animation loop cycle for each dot.
 */
export function useStaggeredDots(): [Animated.Value, Animated.Value, Animated.Value] {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const runDot = (val: Animated.Value, startDelay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(val, { toValue: 1.0, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - startDelay),
        ])
      ).start();
    };

    runDot(dot1, 0);
    runDot(dot2, 200);
    runDot(dot3, 400);

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  return [dot1, dot2, dot3];
}

/**
 * Sequential dot pulsing animation component for the processing/initiation states.
 */
export default function StaggeredDots(): React.ReactElement {
  const [dot1, dot2, dot3] = useStaggeredDots();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
  },
});
