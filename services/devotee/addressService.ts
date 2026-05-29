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

  const streetStr = addr.street || '';
  const commaIndex = streetStr.indexOf(',');
  const houseNo = commaIndex !== -1 ? streetStr.substring(0, commaIndex).trim() : '';
  const street = commaIndex !== -1 ? streetStr.substring(commaIndex + 1).trim() : streetStr;

  const parts = [
    addr.street,
    addr.area,
    addr.landmark ? `Near ${addr.landmark}` : null,
    addr.city,
    addr.state,
    addr.zip ? `Pincode: ${addr.zip}` : null,
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
    pincode: addr.zip || '',
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
      type: address.label === 'Office' || address.label === 'Work' ? 'Work' : (address.label === 'Home' ? 'Home' : 'Other'),
      street: address.houseNo ? `${address.houseNo}, ${address.street}` : address.street,
      area: '',
      city: address.city,
      state: address.state,
      zip: address.pincode,
      landmark: address.landmark || '',
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
