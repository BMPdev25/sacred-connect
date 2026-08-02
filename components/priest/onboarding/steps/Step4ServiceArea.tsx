import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';

import { THEME } from '@/constants/theme';
import { updateStep4Address } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { StepRef } from '@/types/stepRef.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationMode = 'choose' | 'gps' | 'manual';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Step4ServiceArea = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const savedAddress = useSelector((state: RootState) => state.onboarding.step4.address);

  const [locationMode, setLocationMode] = useState<LocationMode>(
    savedAddress ? 'manual' : 'choose'
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [buildingName, setBuildingName] = useState(savedAddress?.buildingName || '');
  const [streetArea, setStreetArea] = useState(savedAddress?.streetArea || '');
  const [landmark, setLandmark] = useState(savedAddress?.landmark || '');
  const [city, setCity] = useState(savedAddress?.city || '');
  const [stateField, setStateField] = useState(savedAddress?.state || '');
  const [pincode, setPincode] = useState(savedAddress?.pincode || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  async function handleDetectLocation(): Promise<void> {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to detect your address. Please enable it in Settings.',
          [
            { text: 'Cancel', onPress: () => setIsDetecting(false) },
            { text: 'Open Settings', onPress: () => { Linking.openSettings(); setIsDetecting(false); } },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setStreetArea(address?.street || address?.district || '');
      setCity(address?.city || address?.subregion || '');
      setStateField(address?.region || '');
      setPincode(address?.postalCode || '');
      setCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      setLocationMode('gps');
    } catch (error) {
      Alert.alert('Location Error', 'Unable to detect your location. Please try again or enter manually.');
    } finally {
      setIsDetecting(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!buildingName.trim()) errs.buildingName = 'Required';
    if (!streetArea.trim()) errs.streetArea = 'Required';
    if (!city.trim()) errs.city = 'Required';
    if (pincode.trim().length !== 6) errs.pincode = 'Must be 6 digits';
    if (!stateField.trim()) errs.stateField = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function saveToRedux(): void {
    const addr = {
      buildingName: buildingName.trim(),
      streetArea: streetArea.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: stateField.trim(),
      pincode: pincode.trim(),
      fullAddress: [buildingName, streetArea, landmark, city, stateField, pincode]
        .filter(Boolean)
        .join(', '),
    };
    dispatch(updateStep4Address({
      address: addr,
      coordinates: coordinates || { lat: 0, lng: 0 },
    }));
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (locationMode === 'choose') {
        setStepErrors(['Please select a location method to continue']);
        return false;
      }
      const valid = validate();
      if (!valid) {
        setStepErrors(['Please fill in all required address fields']);
      } else {
        setStepErrors([]);
        saveToRedux();
      }
      return valid;
    },
  }));

  // -------------------------------------------------------------------------
  // Choose screen
  // -------------------------------------------------------------------------

  if (locationMode === 'choose') {
    return (
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >
        <Text style={styles.heading}>Where do you conduct ceremonies?</Text>

        {stepErrors.map((e) => (
          <Text key={e} style={styles.stepError}>{e}</Text>
        ))}

        {/* GPS card */}
        <View style={[styles.optionCard, styles.optionCardPrimary]}>
          <View style={styles.optionRow}>
            <Ionicons name="locate-outline" size={28} color={THEME.colors.primary} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Use My Current Location</Text>
              <Text style={styles.optionSubtitle}>We'll detect your address automatically</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleDetectLocation}
            disabled={isDetecting}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {isDetecting ? 'Detecting…' : 'Detect Location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual card */}
        <View style={styles.optionCard}>
          <View style={styles.optionRow}>
            <Ionicons name="create-outline" size={28} color={THEME.colors.textMuted} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Enter Address Manually</Text>
              <Text style={styles.optionSubtitle}>Type your full address</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => setLocationMode('manual')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // -------------------------------------------------------------------------
  // Address form (gps or manual)
  // -------------------------------------------------------------------------

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={80}
    >
      {locationMode === 'gps' && (
        <View style={styles.gpsBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={styles.gpsBannerText}>Location detected — please confirm your details</Text>
        </View>
      )}

      {locationMode === 'manual' && (
        <Text style={styles.heading}>Enter your service location</Text>
      )}

      {stepErrors.map((e) => (
        <Text key={e} style={styles.stepError}>{e}</Text>
      ))}

      <SimpleInput
        label="Building / Flat No."
        value={buildingName}
        onChangeText={setBuildingName}
        error={errors.buildingName}
        autoCapitalize="words"
      />

      <SimpleInput
        label="Street / Area"
        value={streetArea}
        onChangeText={setStreetArea}
        error={errors.streetArea}
        autoCapitalize="words"
      />

      <SimpleInput
        label="Landmark (Optional)"
        value={landmark}
        onChangeText={setLandmark}
        autoCapitalize="words"
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SimpleInput
            label="City"
            value={city}
            onChangeText={setCity}
            error={errors.city}
            autoCapitalize="words"
          />
        </View>
        <View style={{ width: THEME.spacing.sm }} />
        <View style={{ flex: 1 }}>
          <SimpleInput
            label="Pincode"
            value={pincode}
            onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
            error={errors.pincode}
            keyboardType="numeric"
          />
        </View>
      </View>

      <SimpleInput
        label="State"
        value={stateField}
        onChangeText={setStateField}
        error={errors.stateField}
        autoCapitalize="words"
      />

      {locationMode === 'manual' && (
        <TouchableOpacity onPress={() => setLocationMode('choose')} style={styles.gpsLinkWrap}>
          <Text style={styles.gpsLink}>Use GPS instead</Text>
        </TouchableOpacity>
      )}
    </KeyboardAwareScrollView>
  );
});

Step4ServiceArea.displayName = 'Step4ServiceArea';

// ---------------------------------------------------------------------------
// Simple styled input (FloatingInput lacks maxLength support)
// ---------------------------------------------------------------------------

interface SimpleInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function SimpleInput({ label, value, onChangeText, error, keyboardType = 'default', autoCapitalize = 'sentences' }: SimpleInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, focused && inputStyles.inputFocused, !!error && inputStyles.inputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={THEME.colors.textMuted}
      />
      {error ? <Text style={inputStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 4, marginBottom: THEME.spacing.xs },
  label: { fontSize: THEME.typography.caption, color: THEME.colors.textSecondary, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surface,
    minHeight: 44,
  },
  inputFocused: { borderColor: THEME.colors.borderActive },
  inputError: { borderColor: THEME.colors.error },
  errorText: { fontSize: THEME.typography.caption, color: THEME.colors.error },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  heading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  stepError: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  optionCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  optionCardPrimary: {
    borderColor: THEME.colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  optionContent: { flex: 1 },
  optionTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.surface,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  dividerText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  gpsBannerText: {
    flex: 1,
    fontSize: THEME.typography.bodySmall,
    color: '#166534',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gpsLinkWrap: {
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  gpsLink: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
