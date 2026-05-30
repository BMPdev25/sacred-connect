/**
 * FloatingInput component — the single text input used across all Sacred Connect
 * screens. Implements a floating label animation, validation checkmark, and
 * error state border coloring via theme tokens.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helpers (extracted named functions — not inline)
// ---------------------------------------------------------------------------

/** Computes the border color based on focus and error states. */
function getBorderColor(isFocused: boolean, hasError: boolean): string {
  if (hasError) return THEME.colors.error;
  if (isFocused) return THEME.colors.borderActive;
  return THEME.colors.border;
}

/** Returns animated label style that transitions between floated and inline positions. */
function getLabelStyle(labelAnim: Animated.Value, hasLeftIcon: boolean): object {
  const leftOffset = hasLeftIcon ? THEME.spacing.md + 32 : THEME.spacing.md;
  return {
    position: 'absolute' as const,
    left: leftOffset,
    top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [THEME.spacing.xs, THEME.spacing.md] }),
    fontSize: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [THEME.typography.caption, THEME.typography.body] }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [THEME.colors.primary, THEME.colors.textMuted],
    }),
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by FloatingInput. */
export interface FloatingInputProps {
  /** Floating label text shown inside / above the field. */
  label: string;
  /** Controlled value for the text input. */
  value: string;
  /** Callback fired when the user changes text. */
  onChangeText: (text: string) => void;
  /** Optional icon rendered on the left of the input text area. */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered on the right; hidden when isValid is true. */
  rightIcon?: React.ReactNode;
  /** When true, shows a green checkmark instead of rightIcon. */
  isValid?: boolean;
  /** Validation error message rendered beneath the field. */
  error?: string;
  /** When true, masks input text for passwords. */
  secureTextEntry?: boolean;
  /** Keyboard type forwarded to the underlying TextInput. */
  keyboardType?: KeyboardTypeOptions;
  /** Auto-capitalisation mode forwarded to TextInput. */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** When false, the field is read-only. */
  editable?: boolean;
  /** testID forwarded to the underlying TextInput for automated testing. */
  testID?: string;
  /** Optional external blur callback, e.g. for per-field validation triggers. */
  onBlur?: () => void;
}

// ---------------------------------------------------------------------------
// Sub-renderer
// ---------------------------------------------------------------------------

/** Renders the right-side adornment: valid checkmark OR rightIcon prop. */
function RightAdornment({
  isValid,
  rightIcon,
}: {
  isValid?: boolean;
  rightIcon?: React.ReactNode;
}): React.ReactElement | null {
  if (isValid) {
    return (
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={THEME.colors.success}
        style={styles.rightAdornment}
      />
    );
  }
  if (rightIcon) {
    return <View style={styles.rightAdornment}>{rightIcon}</View>;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Floating-label text input. The label animates above the field when the
 * input receives focus or has a non-empty value. Supports validation and
 * error states through theme-consistent border coloring.
 */
export default function FloatingInput(props: FloatingInputProps): React.ReactElement {
  const {
    label, value, onChangeText, leftIcon, rightIcon, isValid,
    error, secureTextEntry, keyboardType, autoCapitalize,
    editable = true, testID, onBlur: onBlurProp,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 0 : 1)).current;

  useEffect(() => {
    // Instantly snap the label to floated or inline based on the presence of value when not focused
    if (!isFocused) {
      labelAnim.setValue(value ? 0 : 1);
    }
  }, [value, isFocused, labelAnim]);

  function handleFocus(): void {
    setIsFocused(true);
    Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  }

  function handleBlur(): void {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    }
    if (onBlurProp) onBlurProp();
  }

  const borderColor = getBorderColor(isFocused, Boolean(error));

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor: editable ? THEME.colors.surface : '#F9F9F9',
          },
        ]}
      >
        {leftIcon && <View style={styles.leftAdornment}>{leftIcon}</View>}
        <Animated.Text style={getLabelStyle(labelAnim, Boolean(leftIcon))} numberOfLines={1}>
          {label}
        </Animated.Text>
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          testID={testID}
          placeholderTextColor={THEME.colors.textMuted}
        />
        <RightAdornment isValid={isValid} rightIcon={rightIcon} />
      </View>
      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: THEME.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
  },
  input: {
    flex: 1,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xs,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  inputWithLeft: {
    paddingLeft: THEME.spacing.sm,
  },
  leftAdornment: {
    marginRight: THEME.spacing.xs,
  },
  rightAdornment: {
    marginLeft: THEME.spacing.xs,
  },
  errorText: {
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.xs,
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
});
