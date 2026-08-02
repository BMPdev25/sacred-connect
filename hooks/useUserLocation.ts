import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';

import { RootState } from '@/redux/store';
import { setUserLocation } from '@/redux/slices/userSlice';
import { UserLocation } from '@/types/home.types';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Checks if the cached location fetch timestamp is still fresh (under 10 minutes).
 *
 * @param lastFetched - The timestamp when location was last fetched.
 * @returns True if cached location is valid, false otherwise.
 */
function isCacheValid(lastFetched: number | null): boolean {
  if (!lastFetched) return false;
  const tenMinutesMs = 10 * 60 * 1000;
  return Date.now() - lastFetched < tenMinutesMs;
}

/**
 * Performs reverse geocoding to retrieve the city or locality name.
 *
 * @param lat - Latitude coordinate.
 * @param lng - Longitude coordinate.
 * @returns Mapped city/subregion name, or "Your Location" as fallback.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (results && results.length > 0) {
      const address = results[0];
      return address.city || address.subregion || address.district || 'Your Location';
    }
    return 'Your Location';
  } catch (err) {
    logger.error('reverseGeocode failed', err);
    return 'Your Location';
  }
}

/**
 * Requests location coordinate and performs reverse geocoding for city name.
 *
 * @returns Coordinates and city name string.
 */
async function getCoordsAndCity(): Promise<{
  coords: { latitude: number; longitude: number };
  city: string;
}> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  const city = await reverseGeocode(coords.latitude, coords.longitude);
  return { coords, city };
}

/**
 * Coordinates location permission and retrieval flow, then updates Redux.
 *
 * @param dispatch - Redux app dispatch function.
 * @param setIsLoading - State setter for loading indicators.
 */
async function performLocationFetch(
  dispatch: ReturnType<typeof useDispatch>,
  setIsLoading: (loading: boolean) => void
): Promise<void> {
  setIsLoading(true);
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      dispatch(
        setUserLocation({
          coordinates: null,
          cityName: null,
          permissionStatus: 'denied',
          lastFetched: Date.now(),
        })
      );
      return;
    }

    const { coords, city } = await getCoordsAndCity();
    dispatch(
      setUserLocation({
        coordinates: coords,
        cityName: city,
        permissionStatus: 'granted',
        lastFetched: Date.now(),
      })
    );
  } catch (err) {
    logger.error('performLocationFetch failed', err);
    dispatch(
      setUserLocation({
        coordinates: null,
        cityName: null,
        permissionStatus: 'denied',
        lastFetched: Date.now(),
      })
    );
  } finally {
    setIsLoading(false);
  }
}

// ---------------------------------------------------------------------------
// Hook Definition
// ---------------------------------------------------------------------------

/**
 * Custom hook to manage device location and state synchronisation with Redux.
 * Resolves local cache first, refreshing if older than 10 minutes.
 *
 * @returns Current coordinates, city name, permission status, loading flag, and refresh handler.
 */
export function useUserLocation(): {
  coordinates: { latitude: number; longitude: number } | null;
  cityName: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  isLoading: boolean;
  requestLocation: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const userLocation = useSelector((state: RootState) => state.user.userLocation);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    await performLocationFetch(dispatch, setIsLoading);
  }, [dispatch]);

  useEffect(() => {
    if (!isCacheValid(userLocation.lastFetched)) {
      requestLocation();
    }
  }, [userLocation.lastFetched, requestLocation]);

  return {
    coordinates: userLocation.coordinates,
    cityName: userLocation.cityName,
    permissionStatus: userLocation.permissionStatus,
    isLoading,
    requestLocation,
  };
}
