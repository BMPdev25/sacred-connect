import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface StepIndicatorProps {
  steps: Array<{
    key: string;
    status: 'completed' | 'active' | 'locked';
  }>;
}

/**
 * Renders the circular icon for a specific step status.
 */
const StepIcon = ({ status }: { status: 'completed' | 'active' | 'locked' }) => {
  if (status === 'completed') {
    return (
      <View style={[styles.iconContainer, styles.completedIcon]}>
        <Ionicons name="checkmark" size={16} color={THEME.colors.surface} />
      </View>
    );
  }

  if (status === 'active') {
    return (
      <View style={[styles.iconContainer, styles.activeIcon]}>
        <View style={styles.activeInnerCircle} />
      </View>
    );
  }

  return (
    <View style={[styles.iconContainer, styles.lockedIcon]}>
      <Ionicons name="lock-closed" size={14} color={THEME.colors.textMuted} />
    </View>
  );
};

/**
 * Vertical step indicator timeline for the booking flow.
 */
export const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const lineColor = step.status === 'completed' ? THEME.colors.primary : THEME.colors.border;

        return (
          <View key={step.key}>
            <StepIcon status={step.status} />
            {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    width: 32,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: THEME.colors.primary,
  },
  activeIcon: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  activeInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
  },
  lockedIcon: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  line: {
    width: 2,
    height: 40,
    marginLeft: 13,
  },
});
