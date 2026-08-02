import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

interface TimeoutViewProps {
  /** If true, the full 60 seconds of background confirmation check has expired. */
  hasTimedOutTotal: boolean;
  /** Action handler to redirect the user to the Devotee Home screen. */
  onGoHome: () => void;
}

/**
 * Centered state page informing the user of delayed verification and letting them go home.
 */
export default function TimeoutView({ hasTimedOutTotal, onGoHome }: TimeoutViewProps): React.ReactElement {
  const headingText = hasTimedOutTotal ? 'Verification Delayed' : 'Payment is being processed...';
  const subtext = hasTimedOutTotal
    ? "Payment verification is taking longer than expected. We'll update you once confirmed."
    : "We'll notify you once confirmed.";

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={64} color={THEME.colors.gold} />
      <Text style={styles.heading}>{headingText}</Text>
      <Text style={styles.subtext}>{subtext}</Text>
      <PrimaryButton
        title="Go to Home"
        onPress={onGoHome}
        style={styles.goHomeButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  subtext: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  goHomeButton: {
    width: '80%',
  },
});
