import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

interface MenuRowProps {
  /** The name of the Ionicons icon to render on the left */
  iconName: string;
  /** The display label for the row */
  label: string;
  /** Callback triggered on pressing the row */
  onPress: () => void;
  /** Flag indicating if the link goes to an external app/site */
  isExternal?: boolean;
  /** Flag indicating if the action is destructive (e.g. Log Out) */
  isDestructive?: boolean;
  /** Flag indicating if a bottom border divider should be rendered */
  hasDivider?: boolean;
}

/**
 * Component rendering a selectable menu option row.
 * Respects strict styling rules without inline style overrides.
 */
export function MenuRow({
  iconName,
  label,
  onPress,
  isExternal = false,
  isDestructive = false,
  hasDivider = false,
}: MenuRowProps): React.JSX.Element {
  const textStyle = isDestructive ? styles.labelTextDestructive : styles.labelText;
  const iconColor = isDestructive ? THEME.colors.error : THEME.colors.primary;
  const rightIcon = isExternal ? 'open-outline' : 'chevron-forward';
  const rightIconColor = isDestructive ? THEME.colors.error : THEME.colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.touchable}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowContainer, hasDivider && styles.divider]}>
        <View style={styles.leftContainer}>
          <Ionicons
            name={iconName as any}
            size={22}
            color={iconColor}
            style={styles.icon}
          />
          <Text style={textStyle}>{label}</Text>
        </View>
        <Ionicons
          name={rightIcon as any}
          size={18}
          color={rightIconColor}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    backgroundColor: THEME.colors.surface,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: THEME.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  labelText: {
    fontSize: THEME.typography.body,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  labelTextDestructive: {
    fontSize: THEME.typography.body,
    fontWeight: '500',
    color: THEME.colors.error,
  },
});
