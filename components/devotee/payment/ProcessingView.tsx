import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import Logo from '@/components/shared/Logo';
import MandalaWatermark from './MandalaWatermark';
import ProgressRing from './ProgressRing';
import StaggeredDots from './StaggeredDots';

interface ProcessingViewProps {
  /** The current state: 'initiating' (preparing checkout) or 'processing' (verifying signature). */
  state: 'initiating' | 'processing';
  /** Total cost display string. */
  totalDisplay: string;
}

/**
 * Centered state page containing a Diya logo, circular cost indicator, and animated loading dots.
 */
export default function ProcessingView({ state, totalDisplay }: ProcessingViewProps): React.ReactElement {
  const isInit = state === 'initiating';
  const headingText = isInit ? 'Preparing your payment...' : 'Confirming your booking...';

  return (
    <View style={styles.container}>
      <MandalaWatermark />
      <View style={styles.logoWrap}>
        <Logo size="md" variant="icon-only" />
      </View>
      <ProgressRing totalDisplay={totalDisplay} />
      <Text style={styles.heading}>{headingText}</Text>
      <Text style={styles.subtext}>Please don't close the app</Text>
      <StaggeredDots />
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
  logoWrap: {
    marginBottom: THEME.spacing.xxl,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.maroon,
    textAlign: 'center',
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xs,
  },
  subtext: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
