import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Router } from 'expo-router';

import FloatingInput from '@/components/shared/FloatingInput';
import Logo from '@/components/shared/Logo';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';

interface HeaderProps {
  router: Router;
}

/**
 * Standard back navigation and branding logo header.
 */
export function ForgotPasswordHeader({ router }: HeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.logoWrap}><Logo variant="full" size="md" /></View>
    </View>
  );
}

/**
 * Renders the small decorative primary color dot divider.
 */
export function SmallDivider(): React.JSX.Element {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} /><View style={styles.dividerDot} /><View style={styles.dividerLine} />
    </View>
  );
}

interface StateAProps {
  email: string;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}

/**
 * The email request form (State A).
 */
export function StateAForm({
  email,
  onEmailChange,
  onSubmit,
  loading,
  error,
}: StateAProps): React.JSX.Element {
  const templeImg = AssetService.getImage('auth.temple');
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.heading}>Forgot your password?</Text>
      <View style={styles.dividerWrap}><SmallDivider /></View>
      <Text style={styles.subtext}>Enter your email address and we&apos;ll send you a link to reset it.</Text>
      <FloatingInput
        label="Email address"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={<Ionicons name="mail-outline" size={20} color={THEME.colors.textMuted} />}
        error={error}
      />
      <View style={styles.btnWrap}>
        <PrimaryButton title="Send Reset Link" onPress={onSubmit} loading={loading} />
      </View>
      <View pointerEvents="none" style={styles.templeBgContainer}>
        <Image source={templeImg} style={styles.templeBg} />
      </View>
    </View>
  );
}

interface StateBProps {
  email: string;
  router: Router;
}

/**
 * The success confirmation message (State B).
 */
export function StateBSuccess({ email, router }: StateBProps): React.JSX.Element {
  const successImg = AssetService.getImage('auth.forgotSuccess');
  return (
    <View style={[styles.stateContainer, styles.centeredState]}>
      <Image source={successImg} style={styles.successImage} />
      <Text style={styles.successHeading}>Check your email!</Text>
      <View style={[styles.dividerWrap, { alignSelf: 'center' }]}><SmallDivider /></View>
      <Text style={styles.successBody}>We&apos;ve sent a reset link to</Text>
      <Text style={styles.successEmail}>{email}</Text>
      <Text style={styles.successInstructions}>Check your inbox and follow the link to reset.</Text>
      <View style={styles.backBtnWrap}>
        <PrimaryButton variant="outline" title="Back to Login" onPress={() => router.replace('/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: THEME.spacing.lg },
  backBtn: { marginBottom: THEME.spacing.md, alignSelf: 'flex-start' },
  logoWrap: { marginBottom: THEME.spacing.lg },
  stateContainer: { flex: 1 },
  centeredState: { justifyContent: 'center', alignItems: 'center', paddingTop: THEME.spacing.xxl },
  heading: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.textPrimary, marginBottom: THEME.spacing.sm },
  dividerWrap: { alignItems: 'flex-start', marginBottom: THEME.spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: 120 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: THEME.colors.border },
  dividerDot: { width: 8, height: 8, borderRadius: THEME.borderRadius.pill, backgroundColor: THEME.colors.primary, marginHorizontal: THEME.spacing.xs },
  subtext: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary, marginBottom: THEME.spacing.xl, lineHeight: 22 },
  btnWrap: { marginTop: THEME.spacing.lg },
  templeBgContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, zIndex: -1 },
  templeBg: { width: '100%', height: '100%', opacity: 0.1, resizeMode: 'cover' },
  successImage: { width: 200, height: 200, resizeMode: 'contain' },
  successHeading: { fontSize: THEME.typography.heading, fontWeight: '700', color: THEME.colors.textPrimary, textAlign: 'center', marginTop: THEME.spacing.lg, marginBottom: THEME.spacing.sm },
  successBody: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary, textAlign: 'center' },
  successEmail: { fontSize: THEME.typography.body, fontWeight: '700', color: THEME.colors.primary, textAlign: 'center', marginTop: THEME.spacing.xs, marginBottom: THEME.spacing.sm },
  successInstructions: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, textAlign: 'center', marginTop: THEME.spacing.sm, maxWidth: 260 },
  backBtnWrap: { marginTop: THEME.spacing.xl, width: '100%' },
});
