import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/components/shared/Logo';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the WizardHeader component. */
export interface WizardHeaderProps {
  /** The current active step in the onboarding wizard. */
  currentStep: number;
  /** The total number of steps in the onboarding wizard. */
  totalSteps: number;
  /** Callback triggered when the back button is pressed. */
  onBack: () => void;
  /** Whether the back navigation is currently disabled. */
  isBackDisabled: boolean;
}

// ---------------------------------------------------------------------------
// Named Helper Functions (Extracted for code quality)
// ---------------------------------------------------------------------------

/**
 * Calculates the progress percentage rounded to the nearest integer.
 *
 * @param currentStep - The current step index.
 * @param totalSteps - The total number of steps.
 * @returns Mapped progress percentage (0-100).
 */
function calculateProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((currentStep / totalSteps) * 100);
}

/**
 * Generates the style object for the animated progress bar fill.
 *
 * @param progress - Animated width value.
 * @param containerWidth - Width of the progress bar container.
 * @returns Style object with animated width.
 */
function getProgressBarStyle(progress: Animated.Value, containerWidth: number): ViewStyle {
  return {
    width: progress as any, // Cast to any to satisfy StyleSheet type compatibility for Animated style property
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Header component for the priest onboarding wizard flow.
 * Renders an absolutely positioned back button, centered branding logo with tagline,
 * step label, and an animated progress bar.
 */
export default function WizardHeader({
  currentStep,
  totalSteps,
  onBack,
  isBackDisabled,
}: WizardHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const progressPercent = calculateProgress(currentStep, totalSteps);

  useEffect(() => {
    if (containerWidth > 0) {
      const targetWidth = (progressPercent / 100) * containerWidth;
      Animated.timing(animatedWidth, {
        toValue: targetWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progressPercent, containerWidth, animatedWidth]);

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
      {/* Back button (Absolutely positioned, not in the document flow) */}
      <TouchableOpacity
        onPress={isBackDisabled ? undefined : onBack}
        disabled={isBackDisabled}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={THEME.colors.textPrimary}
          style={isBackDisabled ? styles.backDisabled : undefined}
        />
      </TouchableOpacity>

      {/* Centered logo */}
      <View style={styles.logoRow}>
        <Logo size="md" variant="full" showTagline={true} />
      </View>

      {/* Progress info labels */}
      <View style={styles.infoRow}>
        <Text style={styles.stepLabel}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text style={styles.stepLabel}>{progressPercent}%</Text>
      </View>

      {/* Progress bar */}
      <View
        style={styles.progressBarContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.progressBarFill,
            getProgressBarStyle(animatedWidth, containerWidth),
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: THEME.colors.background,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginBottom: THEME.spacing.md,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backDisabled: {
    opacity: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  stepLabel: {
    color: THEME.colors.maroon,
    fontWeight: '600',
    fontSize: THEME.typography.bodySmall,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
  },
});
