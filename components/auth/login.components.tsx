/** Login screen sub-components — extracted to keep login.tsx under 200 lines. */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import FloatingInput from '@/components/shared/FloatingInput';
import { THEME } from '@/constants/theme';

const ICON_SIZE = 18;
const DIVIDER_HEIGHT = 1;
const GOOGLE_BTN_HEIGHT = 52;
const SEGMENTED_PADDING = 4;

/** Active login tab type. */
export type LoginTab = 'email' | 'phone';

/** Props for the segmented tab control. */
export interface TabControlProps {
  /** Currently active tab. */
  activeTab: LoginTab;
  /** Called when user taps a tab. */
  onTabChange: (tab: LoginTab) => void;
  /** When false the Phone tab is hidden (OTP not yet configured). */
  otpEnabled?: boolean;
}

/**
 * Segmented control toggling between Email and Phone login methods.
 * The Phone tab is only rendered when otpEnabled is true.
 */
export function TabControl({ activeTab, onTabChange, otpEnabled = false }: TabControlProps): React.ReactElement | null {
  // If OTP is disabled there is nothing to toggle — hide the whole control.
  if (!otpEnabled) return null;

  return (
    <View style={styles.segmented}>
      {(['email', 'phone'] as LoginTab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => onTabChange(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'email' ? 'Email' : 'Phone'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Horizontal divider with "or continue with" label. */
export function OrDivider(): React.ReactElement {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or continue with</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/** Props for the email login form. */
export interface EmailFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onTogglePassword: () => void;
}

/**
 * Email address and password inputs for the email login tab.
 */
export function EmailForm(p: EmailFormProps): React.ReactElement {
  return (
    <>
      <FloatingInput
        label="Email Address"
        value={p.email}
        onChangeText={p.onEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={<Ionicons name="mail-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        testID="login-email-input"
      />
      <FloatingInput
        label="Password"
        value={p.password}
        onChangeText={p.onPassword}
        secureTextEntry={!p.showPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        rightIcon={
          <TouchableOpacity onPress={p.onTogglePassword}>
            <Ionicons
              name={p.showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={ICON_SIZE}
              color={THEME.colors.textMuted}
            />
          </TouchableOpacity>
        }
        testID="login-password-input"
      />
    </>
  );
}

/** Props for the Google sign-in button. */
export interface GoogleButtonProps {
  /** Called when the button is tapped. */
  onPress: () => void;
}

/** Outlined Google OAuth button. */
export function GoogleButton({ onPress }: GoogleButtonProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.googleBtn} onPress={onPress}>
      <Text style={styles.googleG}>G</Text>
      <Text style={styles.googleLabel}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: THEME.borderRadius.pill,
    padding: SEGMENTED_PADDING,
    marginBottom: THEME.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.pill,
  },
  tabActive: {
    backgroundColor: THEME.colors.surface,
    ...THEME.shadow.card,
  },
  tabText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: DIVIDER_HEIGHT,
    backgroundColor: THEME.colors.border,
  },
  dividerText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: GOOGLE_BTN_HEIGHT,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  googleG: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  googleLabel: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
});
