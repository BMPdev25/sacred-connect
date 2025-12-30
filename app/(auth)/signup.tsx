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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import InputField from "../../components/InputField";
import LanguagePicker from "../../components/LanguagePicker";
import { APP_COLORS } from "../../constants/Colors";
import { clearError, register } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";

type UserType = "devotee" | "priest";

interface SignUpState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  userType: UserType;
  languagesSpoken: string[];
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  languagesSpoken?: string;
}

export default function SignUpScreen() {
  const params = useLocalSearchParams();
  const initialUserType = (params.userType === 'devotee' || params.userType === 'priest')
    ? (params.userType as UserType)
    : 'devotee';

  const [state, setState] = useState<SignUpState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    userType: initialUserType,
    languagesSpoken: [],
  });

  // Form validation
  const [errors, setErrors] = useState<FormErrors>({});

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert("Registration Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (userInfo) {
      // Progressive onboarding: redirect all users to their home screen
      // Profile completion banner will guide priests to complete their profile
      if (userInfo.userType === "devotee") {
        router.replace("/devotee/HomeTab");
      } else if (userInfo.userType === "priest") {
        router.replace("/priest/HomeTab");
      }
    }
  }, [userInfo]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!state.name) newErrors.name = "Name is required";
    if (!state.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(state.email))
      newErrors.email = "Email is invalid";

    if (!state.phone) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(state.phone.replace(/\D/g, "")))
      newErrors.phone = "Phone number must be 10 digits";

    if (!state.password) newErrors.password = "Password is required";
    else if (state.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!state.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (state.password !== state.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (state.userType === "priest" && state.languagesSpoken.length === 0)
      newErrors.languagesSpoken = "Please select at least one language";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = (): void => {
    if (validateForm()) {
      // If priest, ensure languagesSpoken is present
      if (state.userType === "priest" && state.languagesSpoken.length === 0) {
        setErrors((prev) => ({ ...prev, languagesSpoken: "Please select at least one language" }));
        return;
      }
      dispatch(
        register({
          name: state.name,
          email: state.email,
          phone: state.phone,
          password: state.password,
          userType: state.userType,
          ...(state.userType === "priest" ? { languagesSpoken: state.languagesSpoken } : {}),
        })
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>

            <View style={styles.userTypeContainer}>
              <Text style={styles.sectionTitle}>I am a:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    state.userType === "devotee" && styles.activeUserTypeButton,
                  ]}
                  onPress={() =>
                    setState((prev) => ({ ...prev, userType: "devotee" }))
                  }
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      state.userType === "devotee" &&
                      styles.activeUserTypeButtonText,
                    ]}
                  >
                    Devotee
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    state.userType === "priest" && styles.activeUserTypeButton,
                  ]}
                  onPress={() =>
                    setState((prev) => ({ ...prev, userType: "priest" }))
                  }
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      state.userType === "priest" &&
                      styles.activeUserTypeButtonText,
                    ]}
                  >
                    Priest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <InputField
              label="Full Name"
              value={state.name}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, name: text }))
              }
              placeholder="Enter your full name"
              error={errors.name}
            />

            <InputField
              label="Email"
              value={state.email}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, email: text }))
              }
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <InputField
              label="Phone Number"
              value={state.phone}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, phone: text }))
              }
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <InputField
              label="Password"
              value={state.password}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, password: text }))
              }
              placeholder="Create a password"
              secureTextEntry={!state.showPassword}
              showTogglePassword={true}
              passwordVisible={state.showPassword}
              onTogglePassword={() =>
                setState((prev) => ({
                  ...prev,
                  showPassword: !prev.showPassword,
                }))
              }
              error={errors.password}
            />

            <InputField
              label="Confirm Password"
              value={state.confirmPassword}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, confirmPassword: text }))
              }
              placeholder="Confirm your password"
              secureTextEntry={!state.showPassword}
              error={errors.confirmPassword}
            />

            {state.userType === "priest" && (
              <LanguagePicker
                selectedLanguages={state.languagesSpoken}
                onChange={(languageIds: string[]) =>
                  setState((prev) => ({ ...prev, languagesSpoken: languageIds }))
                }
                error={errors.languagesSpoken}
              />
            )}

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? "Signing Up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
            <View style={styles.authLinkContainer}>
              <Text style={styles.authLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.authLinkAction}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  formContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userTypeButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  activeUserTypeButton: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  userTypeButtonText: {
    fontSize: 16,
    color: APP_COLORS.black,
  },
  activeUserTypeButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  signUpButton: {
    backgroundColor: APP_COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  signUpButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 8,
  },
  authLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  authLinkText: {
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  authLinkAction: {
    color: APP_COLORS.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
});
