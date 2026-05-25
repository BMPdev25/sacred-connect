import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AVATAR_SIZE, EXPERIENCE_MAX, EXPERIENCE_MIN, STEPPER_BTN_SIZE, STEPPER_VALUE_MIN_WIDTH } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';
import { useStepperLogic } from '@/hooks/useStepperLogic';

// ---------------------------------------------------------------------------
// Profile Card Sub-component
// ---------------------------------------------------------------------------

/** Props for ProfileCard. */
interface ProfileCardProps {
  name: string;
  email: string;
  phone: string;
}

/**
 * Read-only card showing the authenticated priest's basic identity details.
 */
export function ProfileCard({ name, email, phone }: ProfileCardProps): React.ReactElement {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.avatar}>
        <Ionicons name="person" size={24} color={THEME.colors.textSecondary} />
      </View>
      <View style={cardStyles.textCol}>
        <Text style={cardStyles.name}>{name || 'Your Name'}</Text>
        <Text style={cardStyles.detail}>{email || '—'}</Text>
        <Text style={cardStyles.detail}>{phone || '—'}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  detail: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
  },
});

// ---------------------------------------------------------------------------
// Experience Stepper Sub-component
// ---------------------------------------------------------------------------

/** Props for ExperienceStepper. */
interface ExperienceStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isAtMin: boolean;
  isAtMax: boolean;
}

/**
 * Circular stepper control for selecting years of experience.
 */
export function ExperienceStepper({
  value,
  onIncrement,
  onDecrement,
  isAtMin,
  isAtMax,
}: ExperienceStepperProps): React.ReactElement {
  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity
        onPress={onDecrement}
        disabled={isAtMin}
        style={[stepperStyles.btn, isAtMin && stepperStyles.btnDisabled]}
      >
        <Text style={[stepperStyles.btnIcon, isAtMin && stepperStyles.btnIconDisabled]}>−</Text>
      </TouchableOpacity>

      <View style={stepperStyles.valueWrap}>
        <Text style={stepperStyles.value}>{value}</Text>
        <Text style={stepperStyles.caption}>Years</Text>
      </View>

      <TouchableOpacity
        onPress={onIncrement}
        disabled={isAtMax}
        style={[stepperStyles.btn, isAtMax && stepperStyles.btnDisabled]}
      >
        <Text style={[stepperStyles.btnIcon, isAtMax && stepperStyles.btnIconDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.lg,
  },
  btn: {
    width: STEPPER_BTN_SIZE,
    height: STEPPER_BTN_SIZE,
    borderRadius: STEPPER_BTN_SIZE / 2,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
  },
  btnDisabled: {
    borderColor: THEME.colors.disabled,
    backgroundColor: THEME.colors.background,
  },
  btnIcon: {
    fontSize: THEME.typography.heading,
    color: THEME.colors.textPrimary,
    lineHeight: 28,
  },
  btnIconDisabled: {
    color: THEME.colors.disabled,
  },
  valueWrap: {
    minWidth: STEPPER_VALUE_MIN_WIDTH,
    alignItems: 'center',
  },
  value: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  caption: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
