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
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { AppDispatch, RootState } from "../../redux/store";
import InputField from "../../components/InputField";
import LanguagePicker from "../../components/LanguagePicker";
import { APP_COLORS } from "../../constants/Colors";
import { clearError, register } from "../../redux/slices/authSlice";
import { updateFormData } from "../../redux/slices/onboardingSlice";

type UserType = "devotee" | "priest";

export default function SignUpScreen() {
  const params = useLocalSearchParams();
  const initialUserType = (params.userType === 'devotee' || params.userType === 'priest')
    ? (params.userType as UserType)
    : 'devotee';

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, userInfo } = useSelector((state: RootState) => state.auth);

  // --- WIZARD STATE ---
  // Step 1: Credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

  // Validation Errors
  const [errors, setErrors] = useState<any>({});
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // --- EFFECTS ---

  // Clear auth errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, []);


  // --- VALIDATION & NAVIGATION ---

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!name.trim()) newErrors.name = "Name is required";

    // Require at least one contact method
    if (!email.trim() && !phone.trim()) {
      newErrors.email = "Either Email or Phone is required";
      newErrors.phone = "Either Email or Phone is required";
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email";
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = "Invalid phone number";
    }

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Min 6 chars";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords mismatch";

    if (userType === 'priest' && languagesSpoken.length === 0) {
      newErrors.languagesSpoken = "Select at least one language";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateStep1()) return;

    if (userType === 'priest') {
      dispatch(updateFormData({
        name,
        email,
        password,
        whatsappNumber: phone,
        languages: languagesSpoken
      }));
      router.replace("/priest/OnboardingWizard" as any);
      return;
    }

    setSubmissionLoading(true);
    dispatch(register({ name, email, phone, password, userType }))
      .unwrap()
      .then(() => {
        router.replace("/devotee/HomeTab");
      })
      .catch((err: any) => {
        Alert.alert("Registration Failed", err || "Unknown error");
      })
      .finally(() => setSubmissionLoading(false));
  };


  // --- RENDERS ---

  return (
    <LinearGradient
      colors={['#FFE5D9', '#FFF5E6', APP_COLORS.background]}
      locations={[0, 0.4, 1]}
      style={styles.safeArea}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Create Account
          </Text>

          {/* CREDENTIALS */}
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

          {/* ACTION BUTTONS */}
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleSubmit}
            disabled={submissionLoading}
          >
            {submissionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainBtnText}>
                Complete Signup
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 50,
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  backBtn: { marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#704214", marginBottom: 16, fontFamily: "serif" },
  stepIndicator: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 20 },

  formSection: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(112, 66, 20, 0.05)',
  },

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
  mainBtn: {
    backgroundColor: APP_COLORS.primary,
    height: 52,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 4,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: "serif" }
});
