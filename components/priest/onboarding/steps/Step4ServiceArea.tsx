import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';

import {
  LocationButton,
  MapSection,
  RadiusSection,
  styles,
} from '@/components/priest/onboarding/steps/Step4.subcomponents';

import { THEME } from '@/constants/theme';
import { updateStep4Location } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Step 4 of the priest onboarding wizard.
 * Handles selecting an operating location via GPS and setting a service radius.
 */
export const Step4ServiceArea = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const reduxStep4 = useSelector((state: RootState) => state.onboarding.step4);
  const initialCoords = (reduxStep4.location.latitude === 0 && reduxStep4.location.longitude === 0) ? null : reduxStep4.location;

  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | 'undetermined'>('undetermined');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(initialCoords);
  const [radiusKm, setRadiusKm] = useState<number>(reduxStep4.serviceRadiusKm || 15);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  async function checkInitialPermissions(): Promise<void> {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
    if (status === 'granted' && !coordinates) {
      handleGetLocation();
    }
  }

  async function handleGetLocation(): Promise<void> {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCoordinates(newCoords);
      dispatch(updateStep4Location({ location: newCoords, serviceRadiusKm: radiusKm }));
      setStepErrors([]);
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Location Error', 'Unable to fetch your current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }

  function handleRadiusChange(value: number): void {
    setRadiusKm(value);
    if (coordinates) {
      dispatch(updateStep4Location({ location: coordinates, serviceRadiusKm: value }));
    }
  }

  function handleManualSearch(): void {
    Alert.alert('Coming Soon', 'Manual location search will be available soon. Please use GPS for now.');
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs: string[] = [];
      if (!coordinates) {
        errs.push('Please set your location to continue');
      }
      setStepErrors(errs);
      return errs.length === 0;
    },
    validateStep4: () => {
      const errs: string[] = [];
      if (!coordinates) {
        errs.push('Please set your location to continue');
      }
      setStepErrors(errs);
      return { isValid: errs.length === 0, errors: errs };
    },
  } as any));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Validation Errors */}
      {stepErrors.map((err) => <Text key={err} style={styles.stepError}>{err}</Text>)}

      {/* Map Section */}
      <MapSection coordinates={coordinates} locationPermission={locationPermission} />

      {/* Location Button */}
      <LocationButton isLoading={isLoadingLocation} onPress={handleGetLocation} />

      {/* Manual Search Link */}
      <TouchableOpacity onPress={handleManualSearch} style={styles.manualSearchWrapper}>
        <Text style={styles.manualSearchText}>Search a different location</Text>
      </TouchableOpacity>

      {/* Radius Section */}
      <RadiusSection radiusKm={radiusKm} onRadiusChange={handleRadiusChange} />
    </ScrollView>
  );
});

Step4ServiceArea.displayName = 'Step4ServiceArea';
