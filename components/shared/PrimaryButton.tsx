/**
 * PrimaryButton component — the single CTA button used across Sacred Connect.
 * Supports three visual variants (primary gradient, outline, ghost), loading
 * and disabled states, and an optional left icon. All sizing and colour
 * values come from THEME tokens — never hardcoded.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUTTON_HEIGHT = 56;

// ---------------------------------------------------------------------------
// Helper functions (named, not inline)
// ---------------------------------------------------------------------------

/**
 * Returns the container ViewStyle for the given variant and disabled state.
 * The LinearGradient wrapper overrides background for the primary variant,
 * so this only needs to handle outline/ghost/disabled container styling.
 */
function getButtonStyle(variant: PrimaryButtonProps['variant'], disabled: boolean): ViewStyle {
  if (disabled) {
    return styles.containerDisabled;
  }
  switch (variant) {
    case 'outline': return styles.containerOutline;
    case 'ghost':   return styles.containerGhost;
    default:        return styles.containerPrimary;
  }
}

/**
 * Returns the text TextStyle for the given variant and disabled state.
 */
function getTextStyle(variant: PrimaryButtonProps['variant'], disabled: boolean): TextStyle {
  if (disabled) return styles.textDisabled;
  switch (variant) {
    case 'outline': return styles.textOutline;
    case 'ghost':   return styles.textGhost;
    default:        return styles.textPrimary;
  }
}

/**
 * Renders the inner button content: spinner during loading,
 * or optional icon + label text otherwise.
 */
function renderContent(
  loading: boolean,
  title: string,
  leftIcon: React.ReactNode | undefined,
  textStyle: TextStyle,
): React.ReactNode {
  if (loading) {
    return <ActivityIndicator color={THEME.colors.surface} size="small" />;
  }
  return (
    <View style={styles.contentRow}>
      {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
      <Text style={[styles.label, textStyle]} numberOfLines={1}>{title}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by PrimaryButton. */
export interface PrimaryButtonProps {
  /** Label text rendered on the button. */
  title: string;
  /** Callback fired when the button is pressed. */
  onPress: () => void;
  /** When true, replaces the label with a spinner and disables presses. */
  loading?: boolean;
  /** When true, applies the disabled appearance and blocks interaction. */
  disabled?: boolean;
  /** Visual treatment: gradient fill, outlined, or text-only ghost. */
  variant?: 'primary' | 'outline' | 'ghost';
  /** Optional icon rendered to the left of the label. */
  leftIcon?: React.ReactNode;
  /** testID forwarded to the TouchableOpacity for automated testing. */
  testID?: string;
  /** Optional custom styling to override container dimensions (e.g. width, height). */
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Primary call-to-action button for Sacred Connect. The default 'primary'
 * variant shows a saffron-to-dark gradient. Pass variant='outline' or
 * variant='ghost' for secondary/tertiary CTAs.
 */
export default function PrimaryButton(props: PrimaryButtonProps): React.ReactElement {
  const {
    title, onPress, loading = false, disabled = false,
    variant = 'primary', leftIcon, testID, style,
  } = props;

  const isDisabled = disabled || loading;
  const containerStyle = getButtonStyle(variant, isDisabled);
  const textStyle = getTextStyle(variant, isDisabled);
  const content = renderContent(loading, title, leftIcon, textStyle);

  const isPrimary = variant === 'primary' && !isDisabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      activeOpacity={0.85}
      style={[styles.touchable, style]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[THEME.colors.primary, THEME.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, containerStyle, style && { height: StyleSheet.flatten(style).height }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.base, containerStyle, style && { height: StyleSheet.flatten(style).height }]}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  base: {
    height: BUTTON_HEIGHT,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  containerPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  containerOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  containerGhost: {
    backgroundColor: 'transparent',
  },
  containerDisabled: {
    backgroundColor: THEME.colors.disabled,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: THEME.spacing.sm,
  },
  label: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
  },
  textPrimary: {
    color: THEME.colors.surface,
  },
  textOutline: {
    color: THEME.colors.textPrimary,
  },
  textGhost: {
    color: THEME.colors.primary,
  },
  textDisabled: {
    color: THEME.colors.surface,
  },
});
