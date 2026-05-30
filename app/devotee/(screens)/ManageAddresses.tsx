import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { THEME } from '@/constants/theme';
import { DevoteeAddress } from '@/types/booking.types';
import * as addressService from '@/services/devotee/addressService';
import { AddressCard } from '@/components/devotee/profile/AddressCard';
import { AddressEmptyState } from '@/components/devotee/profile/AddressEmptyState';
import { ManageAddressesHeader } from '@/components/devotee/profile/ManageAddressesHeader';
import AddEditAddressSheet from '@/components/devotee/AddEditAddressSheet';

/**
 * Devotee Saved Addresses dashboard allowing display, deletion,
 * defaults settings, and editing via a slide-up form sheet.
 */
export default function ManageAddresses(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingAddress, setEditingAddress] = useState<DevoteeAddress | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: addresses } = useQuery<DevoteeAddress[]>({
    queryKey: ['devoteeAddresses'],
    queryFn: addressService.fetchSavedAddresses,
    staleTime: 5 * 60 * 1000,
  });

  const handleEditAddress = (address: DevoteeAddress) => {
    setEditingAddress(address);
    setIsSheetOpen(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsSheetOpen(true);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      queryClient.invalidateQueries({ queryKey: ['devoteeAddresses'] });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to set default address.');
    }
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address?',
      'Remove this saved address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressService.deleteAddress(addressId);
              queryClient.invalidateQueries({ queryKey: ['devoteeAddresses'] });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete address.');
            }
          },
        },
      ]
    );
  };

  const showAddressActions = (address: DevoteeAddress) => {
    const options = [
      { text: 'Edit', onPress: () => handleEditAddress(address) },
      { text: 'Delete', style: 'destructive' as const, onPress: () => handleDelete(address._id) },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    if (!address.isDefault) {
      options.splice(1, 0, {
        text: 'Set as Default',
        onPress: () => handleSetDefault(address._id),
      });
    }

    Alert.alert('Address Options', 'Select an action for this address:', options);
  };

  const renderFooter = () => {
    if (!addresses || addresses.length === 0) {
      return null;
    }
    return (
      <TouchableOpacity
        style={styles.addNewCard}
        onPress={handleAddNewAddress}
        activeOpacity={0.7}
      >
        <Ionicons name="add-outline" size={20} color={THEME.colors.primary} />
        <Text style={styles.addNewCardText}>Add New Address</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <ManageAddressesHeader
        topInset={insets.top}
        onBackPress={() => router.back()}
        onAddPress={handleAddNewAddress}
      />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <AddressCard address={item} onMenuPress={() => showAddressActions(item)} />
        )}
        ListEmptyComponent={<AddressEmptyState onAddPress={handleAddNewAddress} />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + THEME.spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <AddEditAddressSheet
        isVisible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        existingAddress={editingAddress}
        onSaved={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: THEME.spacing.md,
  },
  addNewCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  addNewCardText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
