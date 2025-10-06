import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { clearError, login } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";

interface LoginState {
  phone: string;
  password: string;
  showPassword: boolean;
  religiousTradition: string;
  templeAffiliation: string;
  activeTab: "login" | "signup";
  showReligiousOptions: boolean;
}

export default function LoginScreen() {
  const [state, setState] = useState<LoginState>({
    phone: "",
    password: "",
    showPassword: false,
    religiousTradition: "",
    templeAffiliation: "",
    activeTab: "login",
    showReligiousOptions: false,
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
    if (!state.phone || !state.password) {
      Alert.alert(
        "Validation Error",
        "Please enter your phone number and password"
      );
      return;
    }

    try {
      // Await the login thunk and get the returned user info
      const user = await dispatch(login({ phone: state.phone, password: state.password })).unwrap();

      // Navigate to role-specific home
      if (user?.userType === 'priest') {
        router.replace('/priest/HomeTab' as any);
      } else if (user?.userType === 'devotee') {
        router.replace('/devotee/HomeTab' as any);
      } else {
        // fallback to root or login
        router.replace('/' as any);
      }
    } catch (err: any) {
      // login thunk will have already set error in state; show a friendly alert if needed
      const message = err?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>BookMyPujari</Text>
        </View>

        <View style={styles.formContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              state.activeTab === "login" && styles.activeTabButton,
            ]}
            onPress={() =>
              setState((prev) => ({ ...prev, activeTab: "login" }))
            }
          >
            <Text
              style={[
                styles.tabText,
                state.activeTab === "login" && styles.activeTabText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
        <InputField
          label="Phone Number"
          value={state.phone}
          onChangeText={(text: string) =>
            setState((prev) => ({ ...prev, phone: text }))
          }
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
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
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
        </View>
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
          <TouchableOpacity onPress={() => router.push('/signup' as any)}>
            <Text style={styles.authLinkAction}>Sign up</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
  formContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
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
  loginButton: {
    backgroundColor: APP_COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
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
  dividerText: {
    marginHorizontal: 10,
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: APP_COLORS.primary,
    fontSize: 14,
  },
  authLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  authLinkText: {
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  authLinkAction: {
    color: APP_COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
});
