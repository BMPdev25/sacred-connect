/**
 * SignupPriestScreen — registers a new Priest user.
 * Built using shared signup components and hooks to ensure identical structure.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FloatingInput from '@/components/shared/FloatingInput';
import Logo from '@/components/shared/Logo';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { useSignupForm } from '@/hooks/useSignupForm';
import { store } from '@/redux/store';
import { setUserSession } from '@/redux/slices/userSlice';
import { completeGoogleSignup } from '@/services/auth/authService';
import { isValidPhone } from '@/services/auth/authValidation';
import { setPendingGoogleProfile, setSignupInProgress } from '@/services/auth/signupState';
import { getReadableErrorMessage } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

import { LegalText, SignupFormFields } from '@/components/auth/signup.components';
import { handlePriestSignup } from '@/handlers/auth/signup.handlers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIVIDER_HEIGHT = 1;
const ICON_SIZE = 18;

// ---------------------------------------------------------------------------
// Google-prefilled branch — the Firebase account already exists (created
// during Google sign-in), so this only collects the remaining fields
// (phone) and completes the backend registration directly, without a
// password or a new Firebase account.
// ---------------------------------------------------------------------------

interface GooglePrefilledFormProps {
  email: string;
  name: string;
  router: ReturnType<typeof useRouter>;
}

function GooglePrefilledForm({ email, name, router }: GooglePrefilledFormProps): React.ReactElement {
  const [nameValue, setNameValue] = useState(name);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [generalError, setGeneralError] = useState('');
  const [isRoleConflict, setIsRoleConflict] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(): Promise<void> {
    const validation = isValidPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error ?? 'Invalid phone number.');
      return;
    }
    setPhoneError(undefined);
    setGeneralError('');
    setIsRoleConflict(false);
    setIsLoading(true);
    try {
      const profile = await completeGoogleSignup('priest', { phone, name: nameValue });
      setPendingGoogleProfile(null);
      store.dispatch(setUserSession({ user: profile }));
      router.replace('/priest/onboarding');
    } catch (err: any) {
      logger.error('Google priest signup failed', err);
      if (err.code === 'ROLE_CONFLICT') setIsRoleConflict(true);
      setGeneralError(err.message || getReadableErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.formArea}>
      <FloatingInput
        label="Full Name"
        value={nameValue}
        onChangeText={setNameValue}
        editable={!name}
        autoCapitalize="words"
        leftIcon={<Ionicons name="person-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        testID="signup-priest-google-name-input"
      />
      <FloatingInput
        label="Email Address"
        value={email}
        onChangeText={() => {}}
        editable={false}
        leftIcon={<Ionicons name="mail-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        testID="signup-priest-google-email-input"
      />
      <FloatingInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        onBlur={() => setPhoneError(isValidPhone(phone).error ?? undefined)}
        keyboardType="phone-pad"
        error={phoneError}
        leftIcon={<Text style={styles.dialCode}>+91</Text>}
        testID="signup-priest-google-phone-input"
      />

      {Boolean(generalError) && <Text style={styles.errorText}>{generalError}</Text>}
      {isRoleConflict && (
        <TouchableOpacity
          onPress={() => {
            // Abandoning this Google new-user attempt — release the
            // semaphore so the listener resumes normal routing.
            setSignupInProgress(false);
            setPendingGoogleProfile(null);
            router.push('/login');
          }}
          style={styles.roleConflictLinkWrap}
        >
          <Text style={styles.loginLink}>Log in instead</Text>
        </TouchableOpacity>
      )}

      <View style={styles.ctaWrap}>
        <PrimaryButton
          title="Register as Pandit"
          onPress={onSubmit}
          loading={isLoading}
          testID="signup-priest-google-btn"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignupPriestScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ googleEmail?: string; googleName?: string }>();
  const isGoogleMode = Boolean(params.googleEmail);

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

  const [isRoleConflict, setIsRoleConflict] = useState(false);

  async function onSubmit(): Promise<void> {
    if (!validateAll()) return;
    const payload = buildPayload('priest');
    await handlePriestSignup(payload, setIsLoading, setGeneralError, router, setIsRoleConflict);
  }

  return (
    <View style={styles.flex}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={80}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Logo variant="full" size="md" />
        </View>

        {/* Headings */}
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subtext}>
          {isGoogleMode ? 'Just a few more details to finish setting up.' : 'Join our network of trusted pandits'}
        </Text>

        {isGoogleMode ? (
          <GooglePrefilledForm
            email={params.googleEmail as string}
            name={(params.googleName as string) || ''}
            router={router}
          />
        ) : (
          <>
            {/* Form fields */}
            <View style={styles.formArea}>
              <SignupFormFields
                values={formValues}
                errors={fieldErrors}
                onFieldChange={handleFieldChange}
                onFieldBlur={handleFieldBlur}
              />

              {Boolean(generalError) && <Text style={styles.errorText}>{generalError}</Text>}
              {isRoleConflict && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login' as any)}
                  style={styles.roleConflictLinkWrap}
                >
                  <Text style={styles.loginLink}>Log in instead</Text>
                </TouchableOpacity>
              )}

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
          </>
        )}

      </KeyboardAwareScrollView>
    </View>
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
  roleConflictLinkWrap: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.sm,
  },
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
  dialCode: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
});
