import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface EarningStatCardProps {
  /** The Ionicons name of the icon. */
  iconName: keyof typeof Ionicons.glyphMap;
  /** The text value to show (e.g. ₹amount or count). */
  value: string;
  /** Label describing the value (e.g. "This Month"). */
  label: string;
}

/**
 * A styled card displaying individual earnings stats.
 */
export default function EarningStatCard({ iconName, value, label }: EarningStatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconCircle}>
        <Ionicons name={iconName} size={18} color={THEME.colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.gold,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
