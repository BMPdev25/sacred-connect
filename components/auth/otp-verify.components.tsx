import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Router } from 'expo-router';
import Logo from '@/components/shared/Logo';
import { THEME } from '@/constants/theme';

/** Props for OtpHeader. */
interface OtpHeaderProps {
  phone: string;
  router: Router;
}

/**
 * Renders the top back navigation and branding information.
 */
export function OtpHeader({ phone, router }: OtpHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.logoWrap}>
        <Logo variant="full" size="md" />
      </View>

      <Text style={styles.heading}>Verify your number</Text>
      <Text style={styles.subtext}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.boldPhone}>{phone}</Text>
      </Text>
    </View>
  );
}

/** Props for OtpBoxRow. */
interface OtpBoxRowProps {
  digits: string[];
  inputRefs: React.RefObject<TextInput>[];
  focusedIndex: number | null;
  hasError: boolean;
  shakeAnim: Animated.Value;
  onDigitChange: (index: number, value: string) => void;
  onKeyPress: (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

/**
 * Renders the row of 6 OTP TextInput boxes wrapped in a shaking Animated.View.
 */
export function OtpBoxRow({
  digits,
  inputRefs,
  focusedIndex,
  hasError,
  shakeAnim,
  onDigitChange,
  onKeyPress,
  onFocus,
  onBlur,
}: OtpBoxRowProps): React.JSX.Element {
  return (
    <Animated.View style={[styles.boxRow, { transform: [{ translateX: shakeAnim }] }]}>
      {digits.map((digit, i) => {
        const isFocused = focusedIndex === i;
        
        let borderColor: string = THEME.colors.border;
        if (hasError) borderColor = THEME.colors.error;
        else if (isFocused) borderColor = THEME.colors.borderActive;

        return (
          <TextInput
            key={i}
            ref={inputRefs[i]}
            value={digit}
            onChangeText={(val) => onDigitChange(i, val)}
            onKeyPress={(e) => onKeyPress(i, e)}
            onFocus={() => onFocus(i)}
            onBlur={onBlur}
            style={[styles.box, { borderColor }]}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        );
      })}
    </Animated.View>
  );
}

/** Props for OtpTimerText. */
interface OtpTimerTextProps {
  secondsLeft: number;
  isExpired: boolean;
  onResend: () => void;
}

/**
 * Renders the countdown text or active Resend button.
 */
export function OtpTimerText({
  secondsLeft,
  isExpired,
  onResend,
}: OtpTimerTextProps): React.JSX.Element {
  return (
    <View style={styles.timerWrap}>
      {isExpired ? (
        <TouchableOpacity onPress={onResend} style={styles.resendBtn}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.countdown}>
          Resend code in <Text style={styles.boldTimer}>{secondsLeft}s</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: THEME.spacing.xl },
  backBtn: { marginBottom: THEME.spacing.md, alignSelf: 'flex-start' },
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
    lineHeight: 22,
  },
  boldPhone: { color: THEME.colors.textPrimary, fontWeight: '700' },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
    width: '100%',
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surface,
  },
  timerWrap: { alignItems: 'center', marginBottom: THEME.spacing.lg },
  countdown: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary },
  boldTimer: { color: THEME.colors.primary, fontWeight: '600' },
  resendBtn: { paddingVertical: THEME.spacing.xs },
  resendText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
