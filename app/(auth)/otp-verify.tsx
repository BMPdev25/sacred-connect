import React, { useState, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { OTP_RESEND_COOLDOWN } from '@/constants/config';
import { useOtpInput } from '@/hooks/useOtpInput';
import { useCountdown } from '@/hooks/useCountdown';

import { OtpHeader, OtpBoxRow, OtpTimerText } from './otp-verify.components';
import { handleVerify, handleResend } from './otp-verify.handlers';

/**
 * OtpVerifyScreen — verification code screen for phone logins/signups.
 * Includes horizontal shake animations on validation failure.
 */
export default function OtpVerifyScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string; flowContext?: string }>();
  
  const phone = params.phone || '';
  const flowContext = (params.flowContext as 'login' | 'signup') || 'login';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const {
    digits,
    inputRefs,
    handleDigitChange,
    handleKeyPress,
    resetDigits,
    isComplete,
  } = useOtpInput(6);

  const { secondsLeft, isExpired, reset: resetTimer } = useCountdown(OTP_RESEND_COOLDOWN);

  /** Triggers a 5-step horizontal shaking vibration animation. */
  const triggerShake = (): void => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      resetDigits();
    });
  };

  /** Handles click of the primary verification button. */
  const onVerifyPress = (): void => {
    handleVerify(digits, phone, flowContext, router, setError, setLoading, triggerShake);
  };

  /** Handles OTP resend button click. */
  const onResendPress = (): void => {
    handleResend(phone, resetTimer, resetDigits, setError, setLoading);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OtpHeader phone={phone} router={router} />

        <OtpBoxRow
          digits={digits}
          inputRefs={inputRefs}
          focusedIndex={focusedIndex}
          hasError={Boolean(error)}
          shakeAnim={shakeAnim}
          onDigitChange={handleDigitChange}
          onKeyPress={handleKeyPress}
          onFocus={setFocusedIndex}
          onBlur={() => setFocusedIndex(null)}
        />

        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

        <OtpTimerText
          secondsLeft={secondsLeft}
          isExpired={isExpired}
          onResend={onResendPress}
        />

        <View style={styles.footer}>
          <View style={styles.lockRow}>
            <Ionicons name="lock-closed" size={14} color={THEME.colors.textMuted} />
            <Text style={styles.lockText}> Code expires in 10 minutes</Text>
          </View>

          <PrimaryButton
            title="Verify Code"
            onPress={onVerifyPress}
            disabled={!isComplete}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  errorText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.error,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  lockText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});
