import React, { useState, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { OTP_RESEND_COOLDOWN } from '@/constants/config';
import { useOtpInput } from '@/hooks/useOtpInput';
import { useCountdown } from '@/hooks/useCountdown';

import { OtpHeader, OtpBoxRow, OtpTimerText } from '@/components/auth/otp-verify.components';
import { handleVerify, handleResend } from '@/handlers/auth/otp-verify.handlers';

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
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + THEME.spacing.lg, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={80}
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
      </KeyboardAwareScrollView>
    </View>
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
