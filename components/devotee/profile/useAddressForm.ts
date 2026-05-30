import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { DevoteeAddress } from '@/types/booking.types';
import * as addressService from '@/services/devotee/addressService';

interface UseAddressFormProps {
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
 * Custom hook managing the devotee saved address add/edit form states and async save actions.
 */
export function useAddressForm({
  existingAddress,
  onSaved,
  onClose,
  isVisible,
}: UseAddressFormProps) {
  const queryClient = useQueryClient();

  const [label, setLabel] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = existingAddress !== null;

  useEffect(() => {
    if (isVisible) {
      setLabel(existingAddress?.label || '');
      setHouseNo(existingAddress?.houseNo || '');
      setStreet(existingAddress?.street || '');
      setLandmark(existingAddress?.landmark || '');
      setCity(existingAddress?.city || '');
      setState(existingAddress?.state || '');
      setPincode(existingAddress?.pincode || '');
      setIsDefault(existingAddress?.isDefault || false);
    }
  }, [existingAddress, isVisible]);

  const handleSave = async () => {
    setIsSaving(true);
    const addressData = {
      label: label.trim() || undefined,
      houseNo: houseNo.trim(),
      street: street.trim(),
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault,
      fullAddress: [houseNo, street, landmark, city, state, pincode]
        .filter(Boolean)
        .join(', '),
    };

    try {
      let savedAddress: DevoteeAddress;
      if (isEditMode && existingAddress) {
        savedAddress = await addressService.updateAddress(existingAddress._id, addressData);
      } else {
        savedAddress = await addressService.saveAddress(addressData);
      }

      queryClient.invalidateQueries({ queryKey: ['devoteeAddresses'] });
      onSaved(savedAddress);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = !houseNo.trim() || !street.trim() || !city.trim() || !pincode.trim();

  return {
    label,
    setLabel,
    houseNo,
    setHouseNo,
    street,
    setStreet,
    landmark,
    setLandmark,
    city,
    setCity,
    state,
    setState,
    pincode,
    setPincode,
    isDefault,
    setIsDefault,
    isSaving,
    isEditMode,
    handleSave,
    isSaveDisabled,
  };
}
