import React from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { DevoteeAddress } from '@/types/booking.types';
import FloatingInput from '@/components/shared/FloatingInput';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { useAddressForm } from './useAddressForm';

interface AddressFormProps {
  /** The existing address to edit, or null if adding a new address */
  existingAddress: DevoteeAddress | null;
  /** Callback fired after successfully saving the address */
  onSaved: (address: DevoteeAddress) => void;
  /** Callback fired to close the sheet */
  onClose: () => void;
  /** Visibility status of the form */
  isVisible: boolean;
}

/**
 * Encapsulated Address Input Form containing fields for house no, street,
 * landmark, city, state, pincode, and default toggle.
 */
export function AddressForm({
  existingAddress,
  onSaved,
  onClose,
  isVisible,
}: AddressFormProps): React.JSX.Element {
  const safeArea = useSafeAreaInsets();
  const {
    label, setLabel,
    houseNo, setHouseNo,
    street, setStreet,
    landmark, setLandmark,
    city, setCity,
    state, setState,
    pincode, setPincode,
    isDefault, setIsDefault,
    isSaving,
    isEditMode,
    handleSave,
    isSaveDisabled,
  } = useAddressForm({ existingAddress, onSaved, onClose, isVisible });

  const renderInputs = () => (
    <>
      <FloatingInput
        label="Label (e.g. Home, Office)"
        value={label}
        onChangeText={setLabel}
      />
      <FloatingInput
        label="House / Flat No."
        value={houseNo}
        onChangeText={setHouseNo}
      />
      <FloatingInput
        label="Street, Area"
        value={street}
        onChangeText={setStreet}
      />
      <FloatingInput
        label="Landmark (optional)"
        value={landmark}
        onChangeText={setLandmark}
      />
      <FloatingInput
        label="City"
        value={city}
        onChangeText={setCity}
      />
    </>
  );

  const renderStateZip = () => (
    <View style={styles.rowFields}>
      <View style={styles.flexField}>
        <FloatingInput
          label="State"
          value={state}
          onChangeText={setState}
        />
      </View>
      <View style={styles.flexField}>
        <FloatingInput
          label="Pincode"
          value={pincode}
          onChangeText={setPincode}
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderToggle = () => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleText}>Set as default address</Text>
      <Switch
        value={isDefault}
        onValueChange={setIsDefault}
        trackColor={{ true: THEME.colors.primary, false: THEME.colors.border }}
        thumbColor={Platform.OS === 'android' ? (isDefault ? THEME.colors.primary : '#f4f3f4') : undefined}
      />
    </View>
  );

  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>
        {isEditMode ? 'Edit Address' : 'Add New Address'}
      </Text>

      <View style={styles.formFields}>
        {renderInputs()}
        {renderStateZip()}
        {renderToggle()}
      </View>

      <View style={[styles.btnWrapper, { marginBottom: safeArea.bottom + THEME.spacing.md }]}>
        <PrimaryButton
          title={isEditMode ? 'Update Address' : 'Save Address'}
          disabled={isSaveDisabled}
          loading={isSaving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xs,
  },
  title: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    paddingTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  formFields: {
    gap: THEME.spacing.xs,
  },
  rowFields: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  flexField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  toggleText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  btnWrapper: {
    marginTop: THEME.spacing.md,
  },
});
