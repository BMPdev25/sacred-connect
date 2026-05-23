/**
 * RoleSelectionScreen — terminal screen from the onboarding flow.
 * No back button. User picks Devotee or Pandit to continue registration.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/components/shared/Logo';
import { RoleCard } from '@/components/shared/RoleCard';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_PADDING_TOP = 64;
const CARD_GAP = 16;
const HEADING_MARGIN_BOTTOM = 40;
const HEADER_LINE_WIDTH = 40;
const HEADER_LINE_HEIGHT = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RoleSelectionScreen — prompts the user to identify as Devotee or Pandit.
 * Terminal screen; no back arrow shown.
 */
export default function RoleSelectionScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + THEME.spacing.lg }]}>

      {/* Header: logo accent + headings */}
      <View style={[styles.header, { paddingTop: HEADER_PADDING_TOP }]}>
        <View style={styles.logoRow}>
          <Logo variant="icon-only" size="sm" />
          <View style={styles.headerLine} />
        </View>
        <View style={{ marginBottom: HEADING_MARGIN_BOTTOM }}>
          <Text style={styles.heading}>Welcome to Sacred Connect</Text>
          <Text style={styles.subtext}>Tell us how you&apos;ll use the app.</Text>
        </View>
      </View>

      {/* Role cards */}
      <RoleCard
        icon="hand-left-outline"
        title="I'm a Devotee"
        subtitle="Book pandits for pujas and ceremonies"
        onPress={() => router.push('/(auth)/signup-devotee')}
      />

      <View style={{ height: CARD_GAP }} />

      <RoleCard
        icon="person-outline"
        title="I'm a Pandit"
        subtitle="Offer services and earn on your schedule"
        onPress={() => router.push('/(auth)/signup-priest')}
      />

      <View style={styles.spacer} />

      {/* Footer */}
      <TouchableOpacity
        style={styles.loginRow}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.loginPrompt}>Already have an account? </Text>
        <Text style={styles.loginLink}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    marginBottom: THEME.spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xl,
  },
  headerLine: {
    height: HEADER_LINE_HEIGHT,
    width: HEADER_LINE_WIDTH,
    backgroundColor: THEME.colors.primary,
  },
  heading: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtext: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
  spacer: { flex: 1 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: THEME.spacing.lg,
  },
  loginPrompt: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
  loginLink: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});
