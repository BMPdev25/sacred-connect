import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { THEME } from '@/constants/theme';

interface EarningsCardProps {
  /** Base earnings amount in INR. */
  basePrice: number;
  /** Current status of the booking. */
  status: string;
}

/**
 * Renders the saffron-tinted card highlighting earnings for this booking.
 */
export default function EarningsCard({ basePrice, status }: EarningsCardProps): React.JSX.Element {
  const isCompleted = status === 'completed';
  const label = isCompleted ? 'You earned' : 'You will earn';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.amount}>₹{basePrice.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.gold,
    textAlign: 'right',
  },
});
