import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';

import InputField from "../../components/InputField";
import LanguagePicker from "../../components/LanguagePicker";
import { APP_COLORS } from "../../constants/Colors";
import { clearError, register } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import priestService from "../../services/priestService"; // Direct service call for profile update
import { getAllCeremonies } from "../../api/ceremonyService"; // Fetch ceremonies

type UserType = "devotee" | "priest";

export default function SignUpScreen() {
  const params = useLocalSearchParams();
  const initialUserType = (params.userType === 'devotee' || params.userType === 'priest')
    ? (params.userType as UserType)
    : 'devotee';

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, userInfo } = useSelector((state: RootState) => state.auth);

  // --- WIZARD STATE ---
  const [step, setStep] = useState(1);

  // Step 1: Credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

  // Step 2: Profile Details (Priest Only)
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [religiousTradition, setReligiousTradition] = useState("");
  const [location, setLocation] = useState<{ type: string, coordinates: number[] } | null>(null);

  // Step 3: Ceremonies (Priest Only)
  const [ceremonies, setCeremonies] = useState<any[]>([]);
  const [selectedCeremonies, setSelectedCeremonies] = useState<string[]>([]);
  const [loadingCeremonies, setLoadingCeremonies] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<any>({});
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // --- EFFECTS ---

  // Clear auth errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, []);

  // Fetch Ceremonies when entering Step 3
  useEffect(() => {
    if (step === 3 && userType === 'priest' && ceremonies.length === 0) {
      fetchCeremonies();
    }
  }, [step, userType]);

  const fetchCeremonies = async () => {
    try {
      setLoadingCeremonies(true);
      const res = await getAllCeremonies();
      const list = Array.isArray(res) ? res : (res.ceremonies || res.data || []);
      setCeremonies(list);
    } catch (err) {
      console.error("Failed to fetch ceremonies", err);
      Alert.alert("Error", "Could not load ceremonies. Please check connection.");
    } finally {
      setLoadingCeremonies(false);
    }
  };

  // --- LOCATION LOGIC ---
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        type: 'Point',
        coordinates: [loc.coords.longitude, loc.coords.latitude]
      });
      // Alert.alert("Success", "Location captured!");
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Could not fetch location.");
    }
  };


  // --- VALIDATION & NAVIGATION ---

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
    if (!phone) newErrors.phone = "Phone is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Min 6 chars";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords mismatch";

    if (userType === 'priest' && languagesSpoken.length === 0) {
      newErrors.languagesSpoken = "Select at least one language";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!experience) newErrors.experience = "Experience is required";
    if (!bio) newErrors.bio = "Bio is required";
    if (!religiousTradition) newErrors.religiousTradition = "Tradition is required";
    if (!location) newErrors.location = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        if (userType === 'priest') setStep(2);
        else handleSubmitDevotee(); // Devotees sign up immediately
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const toggleCeremony = (id: string) => {
    setSelectedCeremonies(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      return [...prev, id];
    });
  };

  // --- SUBMISSION ---

  const handleSubmitDevotee = () => {
    // Normal register for devotee
    setSubmissionLoading(true);
    dispatch(register({ name, email, phone, password, userType }))
      .unwrap()
      .then(() => {
        // Auto-nav handled by authSlice usually, but let's force check
        router.replace("/devotee/HomeTab");
      })
      .catch(err => {
        Alert.alert("Registration Failed", err || "Unknown error");
      })
      .finally(() => setSubmissionLoading(false));
  };

  const handleSubmitPriest = async () => {
    // Validate Step 3
    if (selectedCeremonies.length < 2) {
      Alert.alert("Selection Required", "Please select at least 2 ceremonies.");
      return;
    }

    setSubmissionLoading(true);

    try {
      // 1. Register User
      const userRes = await dispatch(register({
        name, email, phone, password, userType, languagesSpoken
      })).unwrap();

      const userId = userRes._id; // Ensure we get ID
      if (!userId) throw new Error("Registration failed to return User ID");

      // 2. Update Profile with Extra Details
      // We assume the token is set in Redux/Storage by 'register' action automatically
      // But we might need to wait for state update? usually .unwrap() waits for success.

      const profileData = {
        experience: parseInt(experience),
        religiousTradition,
        description: bio,
        location,
        services: selectedCeremonies.map(id => {
          // Find default price if possible, or 0
          const cer = ceremonies.find(c => c._id === id);
          return {
            ceremonyId: id,
            price: cer?.pricing?.basePrice || 1000,
            durationMinutes: cer?.duration?.typical || 60
          };
        })
      };

      await priestService.updateProfile(profileData);

      // 3. Navigate
      router.replace("/priest/HomeTab");

    } catch (err: any) {
      console.error("Signup Flow Error:", err);
      Alert.alert("Error", err.message || "Failed to complete signup.");
    } finally {
      setSubmissionLoading(false);
    }
  };


  // --- RENDERS ---

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {step === 1 ? "Create Account" : step === 2 ? "Your Profile" : "Select Ceremonies"}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>

          {/* STEP 1: CREDENTIALS */}
          {step === 1 && (
            <View style={styles.formSection}>
              {/* User Type Toggle */}
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeBtn, userType === 'devotee' && styles.typeBtnActive]}
                  onPress={() => setUserType('devotee')}
                >
                  <Text style={[styles.typeText, userType === 'devotee' && styles.typeTextActive]}>Devotee</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, userType === 'priest' && styles.typeBtnActive]}
                  onPress={() => setUserType('priest')}
                >
                  <Text style={[styles.typeText, userType === 'priest' && styles.typeTextActive]}>Priest</Text>
                </TouchableOpacity>
              </View>

              <InputField label="Name" value={name} onChangeText={setName} placeholder="Full Name" error={errors.name} />
              <InputField label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" error={errors.email} keyboardType="email-address" />
              <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="10-digit Mobile" error={errors.phone} keyboardType="phone-pad" />
              <InputField label="Password" value={password} onChangeText={setPassword} placeholder="******" secureTextEntry error={errors.password} />
              <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="******" secureTextEntry error={errors.confirmPassword} />

              {userType === 'priest' && (
                <LanguagePicker
                  selectedLanguages={languagesSpoken}
                  onChange={setLanguagesSpoken}
                  error={errors.languagesSpoken}
                />
              )}
            </View>
          )}

          {/* STEP 2: PROFILE (Priest Only) */}
          {step === 2 && (
            <View style={styles.formSection}>
              <InputField
                label="Years of Experience"
                value={experience}
                onChangeText={setExperience}
                placeholder="e.g. 5"
                keyboardType="numeric"
                error={errors.experience}
              />

              <InputField
                label="Religious Tradition"
                value={religiousTradition}
                onChangeText={setReligiousTradition}
                placeholder="e.g. Vedic, South Indian"
                error={errors.religiousTradition}
              />

              <Text style={styles.label}>Bio / Description</Text>
              <TextInput
                style={[styles.textArea, errors.bio && styles.inputError]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about your background..."
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Location</Text>
              <View style={styles.locationRow}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locText}>
                    {location ? `Lat: ${location.coordinates[1].toFixed(2)}, Lng: ${location.coordinates[0].toFixed(2)}` : "Location not set"}
                  </Text>
                </View>
                <TouchableOpacity onPress={getCurrentLocation} style={styles.locBtn}>
                  <Ionicons name="location" size={20} color="white" />
                  <Text style={styles.locBtnText}>Get Location</Text>
                </TouchableOpacity>
              </View>
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>
          )}

          {/* STEP 3: CEREMONIES (Priest Only) */}
          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.subTitle}>Select at least 2 ceremonies you perform</Text>

              {loadingCeremonies ? (
                <ActivityIndicator size="large" color={APP_COLORS.primary} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.grid}>
                  {ceremonies.map((c) => {
                    const isSelected = selectedCeremonies.includes(c._id);
                    return (
                      <TouchableOpacity
                        key={c._id}
                        style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                        onPress={() => toggleCeremony(c._id)}
                      >
                        <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{c.name}</Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="white" style={styles.checkIcon} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ACTION BUTTONS */}
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={step === 3 || (step === 1 && userType === 'devotee') ? (userType === 'devotee' ? handleSubmitDevotee : handleSubmitPriest) : handleNext}
            disabled={submissionLoading}
          >
            {submissionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainBtnText}>
                {step === 3 || (step === 1 && userType === 'devotee') ? "Complete Signup" : "Next"}
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 20, paddingBottom: 50 },
  backBtn: { marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: APP_COLORS.primary, marginBottom: 4 },
  stepIndicator: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 20 },

  formSection: { marginBottom: 20 },

  // User Type
  typeContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: APP_COLORS.white, elevation: 2 },
  typeText: { fontWeight: '600', color: APP_COLORS.gray },
  typeTextActive: { color: APP_COLORS.primary },

  // Inputs
  label: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 6, fontWeight: '500' },
  textArea: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top'
  },
  inputError: { borderColor: APP_COLORS.error },
  errorText: { color: APP_COLORS.error, fontSize: 12, marginTop: 4 },

  // Location
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationInfo: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
  locText: { color: '#333' },
  locBtn: { flexDirection: 'row', backgroundColor: APP_COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  locBtnText: { color: 'white', marginLeft: 6, fontWeight: '600' },

  // Grid
  subTitle: { fontSize: 16, color: '#333', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', minHeight: 80
  },
  gridItemSelected: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  gridText: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: '#333' },
  gridTextSelected: { color: 'white' },
  checkIcon: { position: 'absolute', top: 8, right: 8 },

  // Main Button
  mainBtn: { backgroundColor: APP_COLORS.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
