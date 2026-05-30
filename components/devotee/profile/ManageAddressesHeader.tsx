import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface ManageAddressesHeaderProps {
  /** The top inset value from safe area hooks */
  topInset: number;
  /** Fired when pressing the back button */
  onBackPress: () => void;
  /** Fired when pressing the add button on the right */
  onAddPress: () => void;
}

/**
 * Custom absolute-positioned Header component for saved address management screen.
 */
export function ManageAddressesHeader({
  topInset,
  onBackPress,
  onAddPress,
}: ManageAddressesHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.headerContainer, { top: topInset }]}>
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>My Addresses</Text>
      </View>
      <TouchableOpacity
        onPress={onAddPress}
        style={styles.addBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add" size={26} color={THEME.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 8,
    padding: 8,
    zIndex: 12,
  },
  addBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 8,
    zIndex: 12,
  },
  titleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  headerTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
});
