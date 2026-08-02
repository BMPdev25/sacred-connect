/**
 * Splash screen — first screen shown on app launch.
 * Runs a fade-in animation, then initializes the Firebase Auth listener
 * which performs routing. User sees the brand screen while auth resolves.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import Logo from '@/components/shared/Logo';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FADE_DURATION_MS = 600;
const BRAND_LETTER_SPACING = 4;

// ---------------------------------------------------------------------------
// Custom hooks (extracted named functions)
// ---------------------------------------------------------------------------

/**
 * Manages the fade-in animation for the splash screen logo and text.
 * Starts the animation immediately on mount.
 *
 * @returns The Animated.Value driving opacity (0 → 1).
 */
function useSplashAnimation(): Animated.Value {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return opacity;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SplashScreen — full-screen branded loading state.
 * Fades in and displays branding while the root layout resolves the auth session.
 */
export default function SplashScreen(): React.ReactElement {
  const opacity = useSplashAnimation();

  return (
    <LinearGradient
      colors={[THEME.colors.primary, THEME.colors.maroon]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" hidden />

      <Animated.View style={[styles.content, { opacity }]}>
        <Logo variant="icon-only" size="lg" />
        <View style={styles.gap} />
        <Text style={styles.brandText}>SACRED CONNECT</Text>
      </Animated.View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  gap: {
    height: THEME.spacing.lg,
  },
  brandText: {
    color: THEME.colors.surface,
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    letterSpacing: BRAND_LETTER_SPACING,
  },
});
