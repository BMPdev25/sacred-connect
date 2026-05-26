import React from 'react';
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { useVerificationPolling } from '@/hooks/useVerificationPolling';
import { AssetService } from '@/services/assets/AssetService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface VerificationStepProps {
  number: number;
  text: string;
  isLast?: boolean;
}

function VerificationStep({ number, text, isLast = false }: VerificationStepProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepLeftCol}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>{number}</Text>
        </View>
        {!isLast && <View style={styles.stepDashedLine} />}
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VerificationStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Start polling in the background without UI blocking
  useVerificationPolling(30000);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Section — Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={AssetService.getImage('auth.forgotSuccess') as any}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Middle Section — Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusHeading}>Profile submitted!</Text>
          <Text style={styles.statusSubheading}>Under review</Text>
        </View>

        {/* Steps Card */}
        <View style={styles.card}>
          <VerificationStep number={1} text="Our team verifies your documents" />
          <VerificationStep number={2} text="Background check completion (24–48 hrs)" />
          <VerificationStep number={3} text="Profile goes live for devotees" isLast={true} />
        </View>

        {/* Support Line */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>Need help? Contact </Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@sacredconnect.in')}>
            <Text style={styles.supportLink}>support@sacredconnect.in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Go to Dashboard Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, THEME.spacing.lg) }]}>
        <PrimaryButton
          variant="outline"
          title="Go to Dashboard"
          onPress={() => router.replace('/priest' as any)}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingTop: THEME.spacing.xxl,
  },
  illustration: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  statusHeading: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.maroon,
    textAlign: 'center',
  },
  statusSubheading: {
    fontSize: THEME.typography.subheading,
    color: THEME.colors.primary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.xl,
    ...THEME.shadow.card,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  stepLeftCol: {
    alignItems: 'center',
    width: 40,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C9A84C', // Gold
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    color: THEME.colors.surface,
    fontWeight: '700',
    fontSize: THEME.typography.body,
  },
  stepDashedLine: {
    height: 24,
    width: 1.5,
    backgroundColor: 'transparent',
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  stepText: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    marginLeft: THEME.spacing.md,
    marginTop: 8, // align with center of circle
  },
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.xl,
  },
  supportText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  supportLink: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
});
