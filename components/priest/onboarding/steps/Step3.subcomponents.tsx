/**
 * Sub-components for Step3Services.
 * Extracted to keep the main step file under 200 lines.
 */

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PRICE_MAX } from '@/constants/onboarding';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One priced row in Step 3 — a puja selected in Step 2, awaiting a price. */
export interface PriceRowValues {
  ceremonyId: string;
  ceremonyName: string;
  /** Admin-configured minimum, if the catalog fetch resolved it. */
  basePrice?: number;
  /** Kept as string while the user types. */
  price: string;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Validates a single price entry. Returns an error string, or undefined if valid. */
export function validatePrice(price: string, basePrice?: number): string | undefined {
  const priceNum = Number(price);
  if (!price || isNaN(priceNum) || priceNum <= 0) return 'Enter a valid price';
  if (priceNum >= PRICE_MAX) return `Price must be under ₹${PRICE_MAX.toLocaleString('en-IN')}`;
  if (basePrice !== undefined && priceNum < basePrice) {
    return `Price must be at least ₹${basePrice.toLocaleString('en-IN')} (base price set by admin)`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// PriceRow
// ---------------------------------------------------------------------------

/** Props for PriceRow. */
interface PriceRowProps {
  row: PriceRowValues;
  error?: string;
  onChangePrice: (price: string) => void;
}

/**
 * One card per puja selected in Step 2: name, admin base-price hint, and a
 * price input. There is no ceremony picker here — the puja list itself comes
 * from Step 2's selections, so this step is purely about setting prices.
 */
export function PriceRow({ row, error, onChangePrice }: PriceRowProps): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={2}>{row.ceremonyName}</Text>
      <View style={[styles.priceRow, error ? styles.priceRowError : null]}>
        <Text style={styles.prefix}>₹</Text>
        <TextInput
          style={styles.input}
          value={row.price}
          onChangeText={onChangePrice}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={THEME.colors.textMuted}
          maxLength={6}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : row.basePrice !== undefined ? (
        <Text style={styles.hintText}>Min ₹{row.basePrice.toLocaleString('en-IN')} (set by admin)</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    ...THEME.shadow.card,
  },
  name: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    minHeight: 44,
  },
  priceRowError: {
    borderColor: THEME.colors.error,
  },
  prefix: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginRight: THEME.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    paddingVertical: THEME.spacing.sm,
  },
  errorText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  hintText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
});
