import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { DevoteeAddress } from '@/types/booking.types';
import * as addressService from '@/services/devotee/addressService';

interface UseAddressFormProps {
  existingAddress: DevoteeAddress | null;
  onSaved: (address: DevoteeAddress) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface FieldErrors {
  houseNo?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function validate(fields: {
  houseNo: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.houseNo.trim()) errors.houseNo = 'House / flat number is required';
  if (!fields.street.trim()) errors.street = 'Street is required';
  if (!fields.city.trim()) errors.city = 'City is required';
  if (!fields.state.trim()) errors.state = 'State is required';
  if (!fields.pincode.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(fields.pincode.trim())) {
    errors.pincode = 'Pincode must be exactly 6 digits';
  }
  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [existingAddress, isVisible]);

  const handleSave = async () => {
    const errors = validate({ houseNo, street, city, state, pincode });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
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
      setSubmitError(error.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = isSaving;

  return {
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
    fieldErrors,
    submitError,
  };
}
