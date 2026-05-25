/**
 * SignupPriestScreen — registers a new Priest user.
 * Built using shared signup components and hooks to ensure identical structure.
 */

import React from 'react';
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

import Logo from '@/components/shared/Logo';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { useSignupForm } from '@/hooks/useSignupForm';

import { LegalText, SignupFormFields } from '@/components/auth/signup.components';
import { handlePriestSignup } from '@/handlers/auth/signup.handlers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIVIDER_HEIGHT = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignupPriestScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    formValues,
    fieldErrors,
    generalError,
    isLoading,
    setIsLoading,
    setGeneralError,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    buildPayload,
  } = useSignupForm();

  async function onSubmit(): Promise<void> {
    if (!validateAll()) return;
    const payload = buildPayload('priest');
    await handlePriestSignup(payload, setIsLoading, setGeneralError, router);
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
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subtext}>Join our network of trusted pandits</Text>

        {/* Form fields */}
        <View style={styles.formArea}>
          <SignupFormFields
            values={formValues}
            errors={fieldErrors}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
          />
          
          {Boolean(generalError) && <Text style={styles.errorText}>{generalError}</Text>}

          {/* Primary CTA */}
          <View style={styles.ctaWrap}>
            <PrimaryButton
              title="Register as Pandit"
              onPress={onSubmit}
              loading={isLoading}
              testID="signup-priest-btn"
            />
          </View>

          {/* Legal Text */}
          <LegalText
            onTermsPress={() => { /* TODO: route to terms */ }}
            onPrivacyPress={() => { /* TODO: route to privacy */ }}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.loginRow}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.colors.background, position: 'relative' },
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
    marginBottom: THEME.spacing.xl,
  },
  formArea: { marginBottom: THEME.spacing.xs },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  ctaWrap: { marginTop: THEME.spacing.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: DIVIDER_HEIGHT,
    backgroundColor: THEME.colors.border,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
