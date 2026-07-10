/**
 * RoleSelectionScreen — terminal screen from the onboarding flow.
 * No back button. User picks Devotee or Pandit to continue registration.
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/components/shared/Logo';
import { RoleCard } from '@/components/shared/RoleCard';
import { THEME } from '@/constants/theme';
import { store } from '@/redux/store';
import { setUserSession } from '@/redux/slices/userSlice';
import { completeGoogleSignup } from '@/services/auth/authService';
import { getPendingGoogleProfile, setPendingGoogleProfile, setSignupInProgress } from '@/services/auth/signupState';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

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

  // Captured once: a brand-new Google sign-in already has a Firebase session
  // (created before this screen was reached), so the two role cards below
  // skip the password-based signup screens for that case.
  const [googleProfile] = useState(() => getPendingGoogleProfile());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isRoleConflict, setIsRoleConflict] = useState(false);

  async function handleGoogleDevotee(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');
    setIsRoleConflict(false);
    try {
      // completeGoogleSignup owns the signup semaphore for the duration of
      // this call (sets it true, clears it in its own finally on both
      // success and failure).
      const profile = await completeGoogleSignup('devotee');
      setPendingGoogleProfile(null);
      store.dispatch(setUserSession({ user: profile }));
      router.replace('/devotee');
    } catch (err: any) {
      logger.error('Google devotee signup failed', err);
      if (err.code === 'ROLE_CONFLICT') setIsRoleConflict(true);
      setError(err.message || getReadableErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDevoteePress(): void {
    if (googleProfile) {
      handleGoogleDevotee();
    } else {
      router.push('/signup-devotee');
    }
  }

  function handlePanditPress(): void {
    if (googleProfile) {
      // Semaphore stays on — signup-priest completes registration and clears it.
      router.push({
        pathname: '/signup-priest',
        params: { googleEmail: googleProfile.email, googleName: googleProfile.name || '' },
      });
    } else {
      router.push('/signup-priest');
    }
  }

  function handleLoginInstead(): void {
    if (googleProfile) {
      // Abandoning the Google new-user flow — release the semaphore so the
      // auth listener resumes normal routing for whatever the user signs
      // into next (their existing account via a different login method).
      setSignupInProgress(false);
      setPendingGoogleProfile(null);
    }
    router.push('/login');
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + THEME.spacing.lg }]}>

      {/* Header: logo accent + headings */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.logoRow}>
          <Logo variant="icon-only" size="sm" />
          <View style={styles.headerLine} />
        </View>
        <View style={{ marginBottom: HEADING_MARGIN_BOTTOM }}>
          <Text style={styles.heading}>Welcome to Sacred Connect</Text>
          <Text style={styles.subtext}>
            {googleProfile
              ? `Signed in as ${googleProfile.email}. Tell us how you'll use the app.`
              : "Tell us how you'll use the app."}
          </Text>
        </View>
      </View>

      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
      {isRoleConflict && (
        <TouchableOpacity onPress={handleLoginInstead} style={{ marginBottom: THEME.spacing.sm }}>
          <Text style={[styles.loginLink, { textAlign: 'center' }]}>Log in instead</Text>
        </TouchableOpacity>
      )}

      {isProcessing ? (
        <ActivityIndicator size="large" color={THEME.colors.primary} style={styles.loadingIndicator} />
      ) : (
        <>
          {/* Role cards */}
          <RoleCard
            icon="hand-left-outline"
            title="I'm a Devotee"
            subtitle="Book pandits for pujas and ceremonies"
            onPress={handleDevoteePress}
          />

          <View style={{ height: CARD_GAP }} />

          <RoleCard
            icon="person-outline"
            title="I'm a Pandit"
            subtitle="Offer services and earn on your schedule"
            onPress={handlePanditPress}
          />
        </>
      )}

      <View style={styles.spacer} />

      {/* Footer */}
      <TouchableOpacity
        style={styles.loginRow}
        onPress={handleLoginInstead}
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
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: THEME.spacing.xl,
  },
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
