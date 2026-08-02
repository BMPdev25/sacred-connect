import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import PrimaryButton from '@/components/shared/PrimaryButton';

interface FailedViewProps {
  /** Description details of the payment failure. */
  errorMessage: string;
  /** Action handler when user retries the payment flow. */
  onTryAgain: () => void;
  /** Action handler to return back to the Booking Summary. */
  onGoBack: () => void;
  /** Set to true when generating a new payment order to disable controls. */
  isRetrying: boolean;
}

/**
 * Centered state page displaying payment rejection feedback and CTAs to try again or cancel.
 */
export default function FailedView(props: FailedViewProps): React.ReactElement {
  const { errorMessage, onTryAgain, onGoBack, isRetrying } = props;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color={THEME.colors.error} />
      <Text style={styles.heading}>Payment Unsuccessful</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      
      <View style={styles.btnStack}>
        <PrimaryButton
          title="Try Again"
          onPress={onTryAgain}
          loading={isRetrying}
        />
        <View style={styles.btnSpacing} />
        <PrimaryButton
          title="Go Back"
          variant="outline"
          onPress={onGoBack}
          disabled={isRetrying}
        />
      </View>
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
  errorMessage: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  btnStack: {
    width: '100%',
    paddingHorizontal: THEME.spacing.md,
  },
  btnSpacing: {
    height: THEME.spacing.sm,
  },
});
