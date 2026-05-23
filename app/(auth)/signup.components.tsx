/**
 * SignupFormFields — the five input fields shared by both signup screens.
 * Extracted so signup-devotee and signup-priest import the same JSX block.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import FloatingInput from '@/components/shared/FloatingInput';
import { THEME } from '@/constants/theme';
import { SignupField, SignupFieldErrors, SignupFormValues } from '@/hooks/useSignupForm';

const ICON_SIZE = 18;

/** Props for SignupFormFields. */
export interface SignupFormFieldsProps {
  /** Current controlled values for all fields. */
  values: SignupFormValues;
  /** Per-field validation error strings. */
  errors: SignupFieldErrors;
  /** Called on every keystroke with the changed field name and new value. */
  onFieldChange: (field: SignupField, value: string) => void;
  /** Called when a field loses focus; triggers single-field validation. */
  onFieldBlur: (field: SignupField) => void;
}

/**
 * Renders the five signup form fields: Name, Email, Phone, Password, Confirm Password.
 * Password fields include an eye-toggle for visibility. All validation is driven by
 * the parent hook via the errors prop.
 */
export function SignupFormFields({
  values, errors, onFieldChange, onFieldBlur,
}: SignupFormFieldsProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
    return (
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={ICON_SIZE}
          color={THEME.colors.textMuted}
        />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <FloatingInput
        label="Full Name"
        value={values.name}
        onChangeText={(v) => onFieldChange('name', v)}
        onBlur={() => onFieldBlur('name')}
        autoCapitalize="words"
        error={errors.name}
        leftIcon={<Ionicons name="person-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        testID="signup-name-input"
      />
      <FloatingInput
        label="Email Address"
        value={values.email}
        onChangeText={(v) => onFieldChange('email', v)}
        onBlur={() => onFieldBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        leftIcon={<Ionicons name="mail-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        testID="signup-email-input"
      />
      <FloatingInput
        label="Phone Number"
        value={values.phone}
        onChangeText={(v) => onFieldChange('phone', v)}
        onBlur={() => onFieldBlur('phone')}
        keyboardType="phone-pad"
        error={errors.phone}
        leftIcon={<Text style={styles.dialCode}>+91</Text>}
        testID="signup-phone-input"
      />
      <FloatingInput
        label="Password"
        value={values.password}
        onChangeText={(v) => onFieldChange('password', v)}
        onBlur={() => onFieldBlur('password')}
        secureTextEntry={!showPassword}
        error={errors.password}
        leftIcon={<Ionicons name="lock-closed-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        rightIcon={<EyeToggle visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
        testID="signup-password-input"
      />
      <FloatingInput
        label="Confirm Password"
        value={values.confirmPassword}
        onChangeText={(v) => onFieldChange('confirmPassword', v)}
        onBlur={() => onFieldBlur('confirmPassword')}
        secureTextEntry={!showConfirm}
        error={errors.confirmPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={ICON_SIZE} color={THEME.colors.textMuted} />}
        rightIcon={<EyeToggle visible={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />}
        testID="signup-confirm-input"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// LegalText — shared "Terms / Privacy" line
// ---------------------------------------------------------------------------

/** Props for the legal consent text shown below the signup CTA. */
export interface LegalTextProps {
  /** Called when the user taps "Terms of Service". */
  onTermsPress: () => void;
  /** Called when the user taps "Privacy Policy". */
  onPrivacyPress: () => void;
}

/**
 * Inline legal consent text with tappable Terms and Privacy links.
 */
export function LegalText({ onTermsPress, onPrivacyPress }: LegalTextProps): React.ReactElement {
  return (
    <View style={styles.legalRow}>
      <Text style={styles.legalBase}>By signing up, you agree to our </Text>
      <TouchableOpacity onPress={onTermsPress}>
        <Text style={styles.legalLink}>Terms of Service</Text>
      </TouchableOpacity>
      <Text style={styles.legalBase}> and </Text>
      <TouchableOpacity onPress={onPrivacyPress}>
        <Text style={styles.legalLink}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dialCode: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  legalBase: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  legalLink: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
  },
});
