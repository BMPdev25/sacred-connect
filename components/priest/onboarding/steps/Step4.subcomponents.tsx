/**
 * Sub-components for Step4ServiceArea.
 */

import React from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Map Section
// ---------------------------------------------------------------------------

interface MapSectionProps {
  coordinates: { latitude: number; longitude: number } | null;
  locationPermission: Location.PermissionStatus | 'undetermined';
}

export function MapSection({ coordinates, locationPermission }: MapSectionProps): React.ReactElement {
  if (coordinates) {
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          scrollEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          zoomEnabled={false}
          initialRegion={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={coordinates}
            title="Your location"
            pinColor={THEME.colors.primary}
          />
        </MapView>
      </View>
    );
  }

  if (locationPermission === 'denied') {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorHeading}>Location access denied</Text>
        <Text style={styles.errorBody}>Please enable location in Settings to continue</Text>
        <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.placeholderCard}>
      <Ionicons name="location-outline" size={40} color={THEME.colors.textMuted} />
      <Text style={styles.placeholderText}>Tap below to set your location</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Location Button
// ---------------------------------------------------------------------------

interface LocationButtonProps {
  isLoading: boolean;
  onPress: () => void;
}

export function LocationButton({ isLoading, onPress }: LocationButtonProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.locationBtn} onPress={onPress} activeOpacity={0.8} disabled={isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" color={THEME.colors.primary} />
      ) : (
        <Ionicons name="locate-outline" size={20} color={THEME.colors.primary} />
      )}
      <Text style={styles.locationBtnText}>Use my current location</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Radius Section
// ---------------------------------------------------------------------------

interface RadiusSectionProps {
  radiusKm: number;
  onRadiusChange: (value: number) => void;
}

export function RadiusSection({ radiusKm, onRadiusChange }: RadiusSectionProps): React.ReactElement {
  return (
    <View style={styles.radiusContainer}>
      <View style={styles.radiusHeader}>
        <Text style={styles.radiusLabel}>I travel up to</Text>
        <View style={styles.radiusValueWrapper}>
          <Text style={styles.radiusValue}>{radiusKm}</Text>
          <Text style={styles.radiusUnit}>km</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={50}
        step={5}
        value={radiusKm}
        minimumTrackTintColor={THEME.colors.primary}
        maximumTrackTintColor={THEME.colors.border}
        thumbTintColor={THEME.colors.primary}
        onValueChange={onRadiusChange}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>5 km</Text>
        <Text style={styles.sliderLabelText}>50 km</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  stepError: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  mapContainer: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    height: 220,
    width: '100%',
    ...THEME.shadow.card,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholderCard: {
    height: 220,
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  placeholderText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  errorCard: {
    height: 220,
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.error,
  },
  errorHeading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  errorBody: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  settingsBtn: {
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
  },
  settingsBtnText: {
    color: THEME.colors.surface,
    fontWeight: '600',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.sm,
    ...THEME.shadow.card,
  },
  locationBtnText: {
    fontSize: THEME.typography.subheading,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  manualSearchWrapper: {
    alignItems: 'center',
    marginTop: -THEME.spacing.sm,
  },
  manualSearchText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  radiusContainer: {
    marginTop: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  radiusLabel: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  radiusValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  radiusValue: {
    fontSize: THEME.typography.displayMedium,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  radiusUnit: {
    fontSize: THEME.typography.subheading,
    color: THEME.colors.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.xs,
  },
  sliderLabelText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
});
