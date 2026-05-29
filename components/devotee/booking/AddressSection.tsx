import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { setSelectedAddress, setActiveSection } from '@/redux/slices/bookingSlice';
import { fetchSavedAddresses, saveAddress } from '@/services/devotee/addressService';
import { DevoteeAddress } from '@/types/booking.types';
import FloatingInput from '@/components/shared/FloatingInput';
import PrimaryButton from '@/components/shared/PrimaryButton';

export function AddressSection() {
  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);
  
  const isLocked = !draft.selectedTimeSlot;

  const [addresses, setAddresses] = useState<DevoteeAddress[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Address Form State
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Fetch addresses when unlocked
  useEffect(() => {
    if (!isLocked) {
      const loadAddresses = async () => {
        try {
          const fetched = await fetchSavedAddresses();
          setAddresses(fetched);
          if (fetched.length === 0) {
            setIsAddingNew(true);
          }
        } catch (error) {
          console.error('Failed to load addresses:', error);
          setIsAddingNew(true);
        }
      };
      loadAddresses();
    }
  }, [isLocked]);

  const handleUseNewAddress = async () => {
    if (!houseNo || !street || !city || !pincode) {
      Alert.alert('Required Fields', 'Please fill in all mandatory address fields.');
      return;
    }

    setIsLoading(true);
    try {
      const fullAddressStr = `${houseNo}, ${street}, ${city} - ${pincode}`;
      const newAddrInput = {
        houseNo,
        street,
        landmark,
        city,
        state: 'Karnataka', // Defaulting for simplicity as per requirements
        pincode,
        fullAddress: fullAddressStr,
      };

      let addressToUse: DevoteeAddress;

      if (saveForFuture) {
        addressToUse = await saveAddress(newAddrInput);
        setAddresses([...addresses, addressToUse]);
      } else {
        // Construct a temporary address object if not saving
        addressToUse = {
          _id: 'temp-' + Date.now(),
          ...newAddrInput,
          isDefault: false,
        };
      }

      dispatch(setSelectedAddress(addressToUse));
      setIsAddingNew(false);
      
      // Reset form
      setHouseNo('');
      setStreet('');
      setLandmark('');
      setCity('');
      setPincode('');
    } catch (error) {
      Alert.alert('Error', 'Failed to use this address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // LOCKED STATE
  if (isLocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>ADDRESS</Text>
        <View style={[styles.card, styles.lockedCard]}>
          <Ionicons name="location-outline" size={20} color={THEME.colors.textMuted} />
          <View style={styles.lockedTextContainer}>
            <Text style={styles.lockedText}>Select address</Text>
            <Text style={styles.hintText}>Complete time selection first</Text>
          </View>
        </View>
      </View>
    );
  }

  // ACTIVE / EXPANDED STATE
  if (draft.activeSection === 'address' || !draft.selectedAddress) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelActive}>SELECT ADDRESS</Text>

        {!isAddingNew && (
          <View>
            {addresses.map((addr) => {
              const isSelected = draft.selectedAddress?._id === addr._id;
              return (
                <TouchableOpacity
                  key={addr._id}
                  style={styles.addressCard}
                  onPress={() => dispatch(setSelectedAddress(addr))}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={isSelected ? THEME.colors.primary : THEME.colors.textMuted}
                  />
                  <View style={styles.addressCardContent}>
                    {addr.label && <Text style={styles.addressLabel}>{addr.label}</Text>}
                    <Text style={styles.addressFullText} numberOfLines={2}>
                      {addr.fullAddress}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {addresses.length > 0 && (
              <TouchableOpacity style={styles.addAddressLink} onPress={() => setIsAddingNew(true)}>
                <Ionicons name="add" size={18} color={THEME.colors.primary} />
                <Text style={styles.addAddressText}>Add new address</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isAddingNew && (
          <View style={styles.formContainer}>
            <FloatingInput
              label="House/Flat No."
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
            <FloatingInput
              label="Pincode"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setSaveForFuture(!saveForFuture)}
            >
              <Ionicons 
                name={saveForFuture ? 'checkbox' : 'square-outline'} 
                size={22} 
                color={saveForFuture ? THEME.colors.primary : THEME.colors.textMuted} 
              />
              <Text style={styles.checkboxText}>Save for future bookings</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Use this address"
              variant="outline"
              onPress={handleUseNewAddress}
              loading={isLoading}
            />

            {addresses.length > 0 && (
              <TouchableOpacity 
                style={styles.cancelLink} 
                onPress={() => setIsAddingNew(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  // COMPLETED STATE
  if (draft.selectedAddress) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabelLocked}>ADDRESS</Text>
        <View style={[styles.card, styles.completedCard]}>
          <TouchableOpacity 
            style={styles.changeLink} 
            onPress={() => dispatch(setActiveSection('address'))}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
          
          <Ionicons name="location" size={24} color={THEME.colors.primary} />
          <View style={styles.completedTextContainer}>
            {draft.selectedAddress.label && (
              <Text style={styles.completedLabel}>{draft.selectedAddress.label}</Text>
            )}
            <Text style={styles.completedFullText} numberOfLines={2}>
              {draft.selectedAddress.fullAddress}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.xl,
  },
  sectionLabelActive: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.primary,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  sectionLabelLocked: {
    fontSize: THEME.typography.caption,
    textTransform: 'uppercase',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: THEME.spacing.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    opacity: 0.5,
    borderWidth: 1,
    borderColor: THEME.colors.textMuted,
    borderStyle: 'dashed',
  },
  lockedTextContainer: {
    marginLeft: 12,
  },
  lockedText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  hintText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 8,
    alignItems: 'center',
    ...THEME.shadow.card,
  },
  addressCardContent: {
    flex: 1,
    paddingLeft: 10,
  },
  addressLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressFullText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  addAddressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    paddingVertical: 8,
  },
  addAddressText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  formContainer: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.borderRadius.md,
    ...THEME.shadow.card,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    paddingVertical: 8,
  },
  checkboxText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  cancelLink: {
    marginTop: THEME.spacing.md,
    alignItems: 'center',
    padding: 8,
  },
  cancelText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
    ...THEME.shadow.card,
    position: 'relative',
  },
  completedTextContainer: {
    marginLeft: 12,
    flex: 1,
    paddingRight: 40,
  },
  completedLabel: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  completedFullText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  changeLink: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  changeText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
