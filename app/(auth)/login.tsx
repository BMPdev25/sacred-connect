import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from "react-redux";
import InputField from "../../components/InputField";
import { APP_COLORS } from "../../constants/Colors";
import { clearError, login, firebaseLogin } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import { detectIdentifierType } from "../../utils/identifierDetection";

interface LoginState {
  identifier: string; // This can be phone or email
  authMethod: "password" | "otp";
  password: string;
  showPassword: boolean;
  otp?: string;
  confirmResult?: any;
  userType: "devotee" | "priest"; // Added user type selection
}

export default function LoginScreen() {
  const [state, setState] = useState<LoginState>({
    identifier: "",
    authMethod: "password", // Default to password
    password: "",
    showPassword: false,
    userType: "devotee", // Default
  });

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert("Login Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = async (): Promise<void> => {
    if (!state.identifier || !state.password) {
      Alert.alert(
        "Validation Error",
        "Please enter your email or mobile number and password"
      );
      return;
    }

    try {
      // Auto-detect identifier type
      const identifierType = detectIdentifierType(state.identifier);

      // Await the login thunk and get the returned user info
      const user = await dispatch(login({ identifier: state.identifier, password: state.password })).unwrap();

      navigateHome(user?.userType);
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    }
  };

  const handleOTPLogin = async () => {
    if (!state.otp) return;
    // Simulate verify
    // In real app, we verify OTP sent to state.identifier (email or phone)
    const identifierType = detectIdentifierType(state.identifier);
    const mockIdToken = `mock_token_${identifierType}_${state.identifier.replace(/[^a-zA-Z0-9]/g, '')}`;

    try {
      await dispatch(firebaseLogin({ idToken: mockIdToken, userType: 'devotee' })).unwrap(); // Defaulting to devotee for OTP login for now or need selector
      navigateHome('devotee'); // Assume devotee for OTP flow or fetch profile
    } catch (e: any) {
      Alert.alert("Login Error", e.message || "Failed");
    }
  };

  const navigateHome = (userType?: string) => {
    if (userType === 'priest') {
      router.replace('/priest/HomeTab' as any);
    } else if (userType === 'devotee') {
      router.replace('/devotee/HomeTab' as any);
    } else {
      router.replace('/' as any);
    }
  }

  const sendOTP = () => {
    if (!state.identifier) {
      Alert.alert("Error", "Enter your email or mobile number");
      return;
    }
    // Simulate sending OTP
    Alert.alert("OTP Sent", `Code sent to ${state.identifier}`);
    setState(prev => ({ ...prev, confirmResult: "mock_confirmation" }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>BookMyPujari</Text>
            <Text style={styles.subtitleText}>Your gateway to divine blessings</Text>
          </View>

          <View style={styles.formContainer}>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.userTypeToggle}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    state.userType === 'devotee' && styles.activeUserTypeButton
                  ]}
                  onPress={() => setState(prev => ({ ...prev, userType: 'devotee' }))}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    state.userType === 'devotee' && styles.activeUserTypeButtonText
                  ]}>Devotee</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    state.userType === 'priest' && styles.activeUserTypeButton
                  ]}
                  onPress={() => setState(prev => ({ ...prev, userType: 'priest' }))}
                >
                  <Text style={[
                    styles.userTypeButtonText,
                    state.userType === 'priest' && styles.activeUserTypeButtonText
                  ]}>Priest</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Identifier Input - Auto-detects Phone or Email */}
            <InputField
              label="Email or Mobile Number"
              value={state.identifier}
              onChangeText={(text: string) =>
                setState((prev) => ({ ...prev, identifier: text }))
              }
              placeholder="Enter your email or mobile number"
              keyboardType="default"
              autoCapitalize="none"
            />

            {/* 3. Auth Method Selection (Password vs OTP) */}
            <View style={styles.methodContainer}>
              <Text style={styles.methodLabel}>Login using:</Text>
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[styles.methodButton, state.authMethod === 'password' && styles.activeMethodButton]}
                  onPress={() => setState(prev => ({ ...prev, authMethod: 'password' }))}
                >
                  <Text style={[styles.methodButtonText, state.authMethod === 'password' && styles.activeMethodButtonText]}>Password</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, state.authMethod === 'otp' && styles.activeMethodButton]}
                  onPress={() => setState(prev => ({ ...prev, authMethod: 'otp' }))}
                >
                  <Text style={[styles.methodButtonText, state.authMethod === 'otp' && styles.activeMethodButtonText]}>OTP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Conditional Rendering based on Method */}
            {state.authMethod === 'password' ? (
              <>
                <InputField
                  label="Password"
                  value={state.password}
                  onChangeText={(text: string) =>
                    setState((prev) => ({ ...prev, password: text }))
                  }
                  placeholder="Enter your password"
                  secureTextEntry={!state.showPassword}
                  showTogglePassword={true}
                  passwordVisible={state.showPassword}
                  onTogglePassword={() =>
                    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                  }
                />
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.otpContainer}>
                {!state.confirmResult ? (
                  <TouchableOpacity
                    style={styles.sendOtpButton}
                    onPress={sendOTP}
                  >
                    <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.otpNote}>Code sent to {state.identifier}. Use 123456 for testing.</Text>
                    <InputField
                      label="Enter OTP"
                      value={state.otp || ""}
                      onChangeText={(text: string) =>
                        setState((prev) => ({ ...prev, otp: text }))
                      }
                      placeholder="123456"
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleOTPLogin}
                      disabled={isLoading}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? "Verifying..." : "Verify & Login"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() =>
                  Alert.alert(
                    "Reset Password",
                    "Please contact support to reset your password."
                  )
                }
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.authLinkContainer}>
                <Text style={styles.authLinkText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/signup', params: { userType: state.userType } })}>
                  <Text style={styles.authLinkAction}>Sign Up</Text>
                </TouchableOpacity>
              </View>
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
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  logoText: {
    fontFamily: "System",
    fontSize: 36,
    fontWeight: "bold",
    color: APP_COLORS.primary,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitleText: {
    fontSize: 16,
    color: APP_COLORS.gray,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  userTypeToggle: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeUserTypeButton: {
    backgroundColor: APP_COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userTypeButtonText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontWeight: '500',
  },
  activeUserTypeButtonText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: APP_COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    elevation: 2,
  },
  loginButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: APP_COLORS.lightGray,
  },
  footerActions: {
    alignItems: 'center',
    gap: 16,
  },
  forgotPasswordButton: {
    alignItems: "center",
  },
  forgotPasswordText: {
    color: APP_COLORS.gray,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  authLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authLinkText: {
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  authLinkAction: {
    color: APP_COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
  },
  activeTypeToggleButton: {
    backgroundColor: APP_COLORS.primary,
  },
  typeToggleText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  activeTypeToggleText: {
    color: APP_COLORS.white,
  },
  methodContainer: {
    marginVertical: 12,
  },
  methodLabel: {
    marginBottom: 8,
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  methodToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    backgroundColor: APP_COLORS.background,
  },
  activeMethodButton: {
    borderColor: APP_COLORS.primary,
    backgroundColor: '#e6f0ff', // Hardcoded light primary for now
  },
  methodButtonText: {
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  activeMethodButtonText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  otpContainer: {
    marginVertical: 10,
  },
  otpNote: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sendOtpButton: {
    backgroundColor: APP_COLORS.secondary || '#ff9900',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sendOtpButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
