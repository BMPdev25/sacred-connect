import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface DetailRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  subtext?: string;
  isLast?: boolean;
}

export function DetailRow({ iconName, text, subtext, isLast = false }: DetailRowProps) {
  return (
    <>
      <View style={styles.row}>
        <Ionicons name={iconName} size={20} color={THEME.colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
          {subtext && <Text style={styles.subtext}>{subtext}</Text>}
        </View>
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  textContainer: {
    flex: 1,
    paddingLeft: THEME.spacing.sm,
  },
  text: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  subtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
});
