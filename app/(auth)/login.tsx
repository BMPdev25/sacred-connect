/** LoginScreen — email+password or phone OTP login. Handlers in login.handlers.ts; sub-components in login.components.tsx. */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingInput from '@/components/shared/FloatingInput';
import Logo from '@/components/shared/Logo';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';

import {
  EmailForm,
  GoogleButton,
  LoginTab,
  OrDivider,
  TabControl,
} from '@/components/auth/login.components';
import {
  handleEmailLogin,
  handleGoogleLogin,
  handleSendOtp,
} from '@/handlers/auth/login.handlers';

/** LoginScreen — email/password and phone OTP login with Google OAuth stub. */
const OTP_ENABLED = process.env.EXPO_PUBLIC_OTP_ENABLED === 'true';

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // When OTP is disabled the tab is always 'email' and cannot be changed.
  const [activeTab, setActiveTab] = useState<LoginTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onPrimaryPress(): void {
    if (activeTab === 'email') {
      handleEmailLogin(email, password, setError, setLoading, router);
    } else {
      handleSendOtp(phone, setError, setLoading, router);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + THEME.spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Logo variant="full" size="md" />
        </View>

        {/* Headings */}
        <Text style={styles.heading}>Welcome back!</Text>
        <Text style={styles.subtext}>Login to continue your spiritual journey</Text>

        {/* Tab switcher — hidden when OTP_ENABLED is false */}
        <TabControl activeTab={activeTab} onTabChange={setActiveTab} otpEnabled={OTP_ENABLED} />

        {/* Form fields */}
        <View style={styles.formArea}>
          {/* Phone tab only reachable when OTP_ENABLED=true and tab is 'phone' */}
          {OTP_ENABLED && activeTab === 'phone' ? (
            <FloatingInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Text style={styles.dialCode}>+91</Text>}
              testID="login-phone-input"
            />
          ) : (
            <>
              <EmailForm
                email={email} password={password} showPassword={showPassword}
                onEmail={setEmail} onPassword={setPassword}
                onTogglePassword={() => setShowPassword((v) => !v)}
              />
              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                style={styles.forgotWrap}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.ctaWrap}>
            <PrimaryButton
              title={OTP_ENABLED && activeTab === 'phone' ? 'Send OTP' : 'Login'}
              onPress={onPrimaryPress}
              loading={loading}
              testID="login-primary-btn"
            />
          </View>
        </View>

        {/* Google sign-in */}
        <OrDivider />
        <GoogleButton onPress={() => handleGoogleLogin(setError, setLoading, router)} />

        {/* Footer */}
        <TouchableOpacity
          style={styles.signupRow}
          onPress={() => router.push('/role-selection')}
        >
          <Text style={styles.signupPrompt}>Don&apos;t have an account? </Text>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  logoWrap: { marginBottom: THEME.spacing.lg },
  heading: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtext: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  formArea: { marginBottom: THEME.spacing.md },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: THEME.spacing.md },
  forgotText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
    marginBottom: THEME.spacing.sm,
  },
  ctaWrap: { marginTop: THEME.spacing.sm },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupPrompt: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
  signupLink: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  dialCode: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
});
