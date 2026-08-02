import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { DetailCard } from './DetailCard';

interface DetailPaymentSectionProps {
  basePrice: number;
  platformFee: number;
  totalAmount: number;
}

/**
 * DetailPaymentSection displays breakdown fees and confirmation status.
 *
 * @param props.basePrice - Original service cost.
 * @param props.platformFee - Platform tax/fee.
 * @param props.totalAmount - Aggregated total cost.
 */
export function DetailPaymentSection({
  basePrice,
  platformFee,
  totalAmount,
}: DetailPaymentSectionProps): React.JSX.Element {
  return (
    <DetailCard title="Payment Details">
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Service Fee</Text>
        <Text style={styles.paymentValue}>₹{basePrice.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Platform Fee (5%)</Text>
        <Text style={styles.paymentValue}>₹{platformFee.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.paymentRow}>
        <Text style={styles.totalLabel}>Total Paid</Text>
        <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
      </View>
      <View style={[styles.paymentRow, { marginTop: THEME.spacing.sm }]}>
        <View style={styles.paidPill}>
          <Text style={styles.paidText}>Paid</Text>
        </View>
        <Text style={styles.secureText}>Secured by Razorpay</Text>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  paymentLabel: { fontSize: THEME.typography.body, color: THEME.colors.textSecondary },
  paymentValue: { fontSize: THEME.typography.body, color: THEME.colors.textPrimary },
  divider: { height: 1, backgroundColor: THEME.colors.border, marginVertical: 8 },
  totalLabel: { fontSize: THEME.typography.body, fontWeight: '700', color: THEME.colors.textPrimary },
  totalValue: { fontSize: THEME.typography.subheading, fontWeight: '700', color: THEME.colors.gold },
  paidPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  paidText: { fontSize: THEME.typography.caption, color: THEME.colors.success, fontWeight: '600' },
  secureText: { fontSize: THEME.typography.caption, color: THEME.colors.textMuted },
});
