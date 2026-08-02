/**
 * RoleCard — animated tappable card for role selection.
 * Extracted to satisfy the 200-line component file limit.
 */

import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_CIRCLE_SIZE = 56;
const ICON_SIZE = 28;
const CHEVRON_SIZE = 20;
const CARD_PADDING = 20;
const PRESSED_SCALE = 0.98;
const SPRING_FRICTION = 4;
const SPRING_TENSION = 100;
const ICON_BG = '#FFF3E0';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Return type for useCardPressAnimation. */
interface CardPressAnimation {
  scale: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Spring-based scale animation hook for card press feedback.
 */
export function useCardPressAnimation(): CardPressAnimation {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn(): void {
    Animated.spring(scale, {
      toValue: PRESSED_SCALE,
      friction: SPRING_FRICTION,
      tension: SPRING_TENSION,
      useNativeDriver: true,
    }).start();
  }

  function onPressOut(): void {
    Animated.spring(scale, {
      toValue: 1,
      friction: SPRING_FRICTION,
      tension: SPRING_TENSION,
      useNativeDriver: true,
    }).start();
  }

  return { scale, onPressIn, onPressOut };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Props for RoleCard. */
export interface RoleCardProps {
  /** Ionicons icon name for the role illustration. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Primary role label. */
  title: string;
  /** Supporting description. */
  subtitle: string;
  /** Press handler. */
  onPress: () => void;
}

/**
 * Tappable role selection card with spring press animation,
 * coloured icon circle, and chevron indicator.
 */
export function RoleCard({ icon, title, subtitle, onPress }: RoleCardProps): React.ReactElement {
  const { scale, onPressIn, onPressOut } = useCardPressAnimation();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={ICON_SIZE} color={THEME.colors.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={THEME.colors.primary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: CARD_PADDING,
    ...THEME.shadow.card,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
  },
});
