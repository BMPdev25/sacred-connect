import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { PriestTransaction } from '@/types/priest.earnings.types';
import { getCeremonyIcon } from '@/utils/ceremonyIconMap';

interface TransactionRowProps {
  /** The transaction details object. */
  transaction: PriestTransaction;
  /** Flags whether this is the final row item in the list to skip the divider line. */
  isLast: boolean;
}

/**
 * Formats a timezone-safe short date label (e.g. "3 Jun 2026").
 *
 * @param dateStr - Date string or ISO timestamp.
 * @returns Human-friendly short date string.
 */
function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Renders an individual transaction ledger row with structured ceremony icons and credit states.
 */
export default function TransactionRow({ transaction, isLast }: TransactionRowProps): React.JSX.Element {
  const ceremonyName = transaction.ceremonyName || 'Ceremony';
  const iconConfig = getCeremonyIcon(ceremonyName);
  const dateLabel = transaction.createdAt ? formatShortDate(transaction.createdAt) : '';
  const subtitle = transaction.devoteeName 
    ? `${transaction.devoteeName} · ${dateLabel}` 
    : dateLabel;

  return (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      {/* Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: iconConfig.backgroundColor }]}>
        <Ionicons name={iconConfig.iconName as any} size={18} color={iconConfig.iconColor} />
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={styles.ceremonyName} numberOfLines={1}>{ceremonyName}</Text>
        <Text style={styles.subtext} numberOfLines={1}>{subtitle}</Text>
      </View>

      {/* Right side credits */}
      <View style={styles.rightContent}>
        <Text style={styles.amount}>+₹{transaction.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.creditedLabel}>Credited</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} style={styles.chevron} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  ceremonyName: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  subtext: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: '#16A34A',
  },
  creditedLabel: {
    fontSize: THEME.typography.caption,
    color: '#16A34A',
    marginTop: 2,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
});
