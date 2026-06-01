import api from '@/api/index';
import { DevoteeAddress } from '@/types/booking.types';
import { logger } from '@/utils/logger';

/**
 * Maps a raw backend address object to the frontend DevoteeAddress type.
 *
 * @param addr - The raw address object from backend.
 * @returns Mapped DevoteeAddress object.
 */
function mapBackendToDevoteeAddress(addr: any): DevoteeAddress {
  if (!addr) {
    throw new Error('Invalid address object');
  }

  const houseNo = addr.houseNo || '';
  const street = addr.street || '';

  const parts = [
    houseNo,
    street,
    addr.area,
    addr.landmark ? `Near ${addr.landmark}` : null,
    addr.city,
    addr.state,
    (addr.pincode || addr.zip) ? `Pincode: ${addr.pincode || addr.zip}` : null,
  ].filter(Boolean);
  const fullAddress = parts.join(', ');

  return {
    _id: addr._id || '',
    label: addr.type || 'Home',
    houseNo,
    street,
    landmark: addr.landmark || undefined,
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.pincode || addr.zip || '',
    fullAddress,
    isDefault: !!addr.isDefault,
  };
}

/**
 * Fetches the list of saved devotee addresses from the backend.
 * Fallbacks to returning an empty array on failure instead of throwing.
 *
 * @returns A promise resolving to an array of DevoteeAddress items.
 */
export async function fetchSavedAddresses(): Promise<DevoteeAddress[]> {
  try {
    const response = await api.get('/devotee/addresses');
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return data.map(mapBackendToDevoteeAddress);
  } catch (err) {
    logger.warn('fetchSavedAddresses failed, returning empty list', err);
    return [];
  }
}

/**
 * Saves a new address on the devotee's backend profile.
 * Maps the address fields to the backend structure and returns the newly saved address.
 *
 * @param address - Address details without _id and isDefault properties.
 * @returns A promise resolving to the created DevoteeAddress with its generated identifier.
 * @throws An error on save failure.
 */
export async function saveAddress(
  address: Omit<DevoteeAddress, '_id' | 'isDefault'>
): Promise<DevoteeAddress> {
  try {
    const payload = {
      houseNo: address.houseNo,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      type: address.label === 'Office' || address.label === 'Work' ? 'Work' : (address.label === 'Home' ? 'Home' : 'Other'),
      isDefault: false,
    };

    const response = await api.post('/devotee/addresses', payload);
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);

    if (!data.length) {
      throw new Error('No addresses returned after saving');
    }

    // Newly added address is appended to the end of the user's addresses array
    const savedBackendAddress = data[data.length - 1];
    return mapBackendToDevoteeAddress(savedBackendAddress);
  } catch (err: any) {
    logger.error('saveAddress failed', err);
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to save address.');
  }
}

/**
 * Updates an existing address on the devotee's backend profile.
 * Maps the address fields to the backend structure and returns the updated address.
 *
 * @param addressId - The unique identifier of the address to update.
 * @param updates - Partial devotee address fields to update.
 * @returns A promise resolving to the updated DevoteeAddress object.
 * @throws An error on update failure.
 */
export async function updateAddress(
  addressId: string,
  updates: Partial<Omit<DevoteeAddress, '_id'>>
): Promise<DevoteeAddress> {
  try {
    const payload: any = {};
    if (updates.label !== undefined) {
      payload.type = updates.label === 'Office' || updates.label === 'Work' ? 'Work' : (updates.label === 'Home' ? 'Home' : 'Other');
    }
    if (updates.houseNo !== undefined) payload.houseNo = updates.houseNo;
    if (updates.street !== undefined) payload.street = updates.street;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.pincode !== undefined) payload.pincode = updates.pincode;
    if (updates.landmark !== undefined) payload.landmark = updates.landmark || '';
    if (updates.isDefault !== undefined) payload.isDefault = updates.isDefault;

    const response = await api.put(`/devotee/addresses/${addressId}`, payload);
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    
    const updatedBackendAddress = data.find((addr: any) => addr._id === addressId);
    if (!updatedBackendAddress) {
      throw new Error('Updated address not found in response');
    }
    
    return mapBackendToDevoteeAddress(updatedBackendAddress);
  } catch (err: any) {
    logger.error('updateAddress failed', err);
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to update address.');
  }
}

/**
 * Deletes a saved address from the devotee's backend profile.
 *
 * @param addressId - The unique identifier of the address to delete.
 * @returns A promise resolving when the deletion is successful.
 * @throws An error with a user-friendly message on failure.
 */
export async function deleteAddress(addressId: string): Promise<void> {
  try {
    await api.delete(`/devotee/addresses/${addressId}`);
  } catch (err: any) {
    logger.error('deleteAddress failed', err);
    throw new Error('Failed to delete address.');
  }
}

/**
 * Sets an address as the default address for the devotee.
 *
 * @param addressId - The unique identifier of the address to mark default.
 * @returns A promise resolving when successful.
 * @throws An error on failure.
 */
export async function setDefaultAddress(addressId: string): Promise<void> {
  try {
    await api.put(`/devotee/addresses/${addressId}`, { isDefault: true });
  } catch (err: any) {
    logger.error('setDefaultAddress failed', err);
    const errMsg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    throw new Error(errMsg || 'Failed to set default address.');
  }
}

