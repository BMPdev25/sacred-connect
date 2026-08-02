import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { DevoteeAddress } from '@/types/booking.types';

interface AddressCardProps {
  /** The address model containing details */
  address: DevoteeAddress;
  /** Triggered when the user taps on the three-dot options menu */
  onMenuPress: () => void;
}

/**
 * Component displaying an address item card.
 * Renders default indicator border, tag pills, details, and action menu.
 */
export function AddressCard({ address, onMenuPress }: AddressCardProps): React.JSX.Element {
  const labelPillStyle = address.isDefault ? styles.labelPillDefault : styles.labelPillOther;
  const labelTextStyle = address.isDefault ? styles.labelTextDefault : styles.labelTextOther;

  return (
    <View style={styles.card}>
      {address.isDefault && <View style={styles.defaultIndicator} />}

      <View style={styles.topRow}>
        <View style={styles.pillsContainer}>
          {!!address.label && (
            <View style={labelPillStyle}>
              <Text style={labelTextStyle}>{address.label}</Text>
            </View>
          )}

          {address.isDefault && (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>Default</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.textContainer, address.isDefault ? styles.textPadding : null]}>
        <Text style={styles.primaryLine}>
          {address.houseNo ? `${address.houseNo}, ` : ''}{address.street}
        </Text>
        <Text style={styles.secondaryLine}>
          {address.city}, {address.state} – {address.pincode}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  defaultIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: THEME.colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  labelPillDefault: {
    backgroundColor: '#FFF3E0',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs - 1,
  },
  labelPillOther: {
    backgroundColor: '#F3F4F6',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs - 1,
  },
  labelTextDefault: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.caption,
    fontWeight: '600',
  },
  labelTextOther: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.typography.caption,
    fontWeight: '600',
  },
  defaultPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs - 1,
  },
  defaultPillText: {
    color: '#16A34A',
    fontSize: THEME.typography.caption,
    fontWeight: '600',
  },
  menuBtn: {
    padding: THEME.spacing.xs,
  },
  textContainer: {
    marginTop: THEME.spacing.sm,
  },
  textPadding: {
    paddingLeft: THEME.spacing.xs,
  },
  primaryLine: {
    fontSize: THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  secondaryLine: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
