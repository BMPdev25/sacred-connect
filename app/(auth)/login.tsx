import { router } from 'expo-router';
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from "react-redux";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../config/firebase";
import InputField from "../../components/InputField";
import { APP_COLORS } from "../../constants/Colors";
import { login } from "../../redux/slices/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import api from "../../api";
import { saveToken } from "../../utils/storage";

type AuthMethod = "password" | "otp";
type UserType = "devotee" | "priest";
type OtpStep = "enter_phone" | "enter_otp";

export default function LoginScreen() {
  // ── Shared ─────────────────────────────────────────────────────────────────
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [userType, setUserType] = useState<UserType>("devotee");
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Password ────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP ─────────────────────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState<OtpStep>("enter_phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null); // shown in dev
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const isSubmitting = isLoading || isSendingOtp || isVerifyingOtp;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const navigateHome = (ut?: string) => {
    if (ut === 'priest') router.replace('/priest/HomeTab' as any);
    else router.replace('/devotee/HomeTab' as any);
  };

  const normalisePhone = (p: string) => {
    const stripped = p.replace(/[\s\-]/g, '');
    return stripped.startsWith('+') ? stripped : `+91${stripped.replace(/^0+/, '')}`;
  };

  // ── Password Login ──────────────────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    setLoginError(null);
    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }
    try {
      const user = await dispatch(login({ identifier: email.trim(), password, userType })).unwrap();
      navigateHome(user?.userType);
    } catch (err: any) {
      const raw = typeof err === "string" ? err : err?.message || "Login failed.";
      setLoginError(raw);
    }
  };

  // ── OTP: Send ────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setLoginError(null);
    const phone = phoneNumber.trim();
    if (!phone) { setLoginError("Please enter your phone number."); return; }

    const e164 = normalisePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
      setLoginError("Enter a valid phone number (e.g. 9876543210).");
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await api.post("/api/auth/send-otp", { phone: e164 });
      // In dev the backend returns the OTP so testers don't need SMS
      if (res.data?.devOtp) setDevOtp(res.data.devOtp);
      setOtpStep("enter_otp");
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── OTP: Verify ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setLoginError(null);
    if (!otp || otp.length < 6) { setLoginError("Please enter the 6-digit OTP."); return; }

    try {
      setIsVerifyingOtp(true);
      const e164 = normalisePhone(phoneNumber);

      // 1. Verify OTP on backend → get Firebase custom token
      const res = await api.post("/api/auth/verify-otp", {
        phone: e164, otp: otp.trim(), userType,
      });

      const { customToken, user: userData } = res.data;

      // 2. Sign into Firebase with the custom token
      await signInWithCustomToken(auth, customToken);

      // 3. Sync with backend to get full profile (interceptor attaches Firebase token)
      const syncRes = await api.post("/api/auth/sync", { userType });
      await saveToken("userInfo", JSON.stringify(syncRes.data));

      navigateHome(syncRes.data?.userType || userData?.userType || userType);
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || "Verification failed. Try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = () => {
    setOtpStep("enter_phone");
    setOtp("");
    setDevOtp(null);
    setLoginError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#FFE5D9', '#FFF5E6', APP_COLORS.background]}
      locations={[0, 0.4, 1]}
      style={styles.safeArea}
    >
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>BookMyPujari</Text>
            <Text style={styles.subtitleText}>Your gateway to divine blessings</Text>
          </View>

          <View style={styles.formContainer}>

            {/* User Type */}
            <View style={styles.sectionWrap}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.toggleRow}>
                {(["devotee", "priest"] as UserType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.toggleBtn, userType === t && styles.toggleBtnActive]}
                    onPress={() => setUserType(t)}
                  >
                    <Text style={[styles.toggleBtnText, userType === t && styles.toggleBtnTextActive]}>
                      {t === "devotee" ? "Devotee" : "Priest"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Auth Method */}
            <View style={styles.sectionWrap}>
              <Text style={styles.label}>Login using:</Text>
              <View style={styles.toggleRow}>
                {(["password", "otp"] as AuthMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, authMethod === m && styles.toggleBtnActive]}
                    onPress={() => { setAuthMethod(m); setLoginError(null); setOtpStep("enter_phone"); }}
                  >
                    <Text style={[styles.toggleBtnText, authMethod === m && styles.toggleBtnTextActive]}>
                      {m === "password" ? "Password" : "Phone OTP"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Error */}
            {loginError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {loginError}</Text>
              </View>
            ) : null}

            {/* ── PASSWORD ── */}
            {authMethod === "password" && (
              <>
                <InputField
                  testID="email-input"
                  label="Email Address"
                  value={email}
                  onChangeText={(t: string) => { setLoginError(null); setEmail(t); }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  testID="password-input"
                  label="Password"
                  value={password}
                  onChangeText={(t: string) => { setLoginError(null); setPassword(t); }}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  showTogglePassword
                  passwordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(p => !p)}
                />
                <TouchableOpacity
                  testID="login-button"
                  style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                  onPress={handlePasswordLogin}
                  disabled={isSubmitting}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Login</Text>}
                </TouchableOpacity>
              </>
            )}

            {/* ── OTP ── */}
            {authMethod === "otp" && (
              <>
                {otpStep === "enter_phone" ? (
                  <>
                    <InputField
                      testID="phone-input"
                      label="Mobile Number"
                      value={phoneNumber}
                      onChangeText={(t: string) => { setLoginError(null); setPhoneNumber(t); }}
                      placeholder="e.g. 9876543210"
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.hint}>
                      India numbers: enter 10 digits. Country code (+91) is added automatically.
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                      onPress={handleSendOtp}
                      disabled={isSubmitting}
                    >
                      {isSendingOtp
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.primaryBtnText}>Send OTP</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.successBanner}>
                      <Text style={styles.successText}>
                        ✅ OTP sent to {normalisePhone(phoneNumber)}
                      </Text>
                    </View>

                    {/* Dev helper: shows OTP directly if backend is in dev mode */}
                    {devOtp ? (
                      <View style={styles.devBanner}>
                        <Text style={styles.devText}>🛠 Dev OTP: {devOtp}</Text>
                      </View>
                    ) : null}

                    <InputField
                      testID="otp-input"
                      label="Enter OTP"
                      value={otp}
                      onChangeText={(t: string) => { setLoginError(null); setOtp(t); }}
                      placeholder="6-digit OTP"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                      onPress={handleVerifyOtp}
                      disabled={isSubmitting}
                    >
                      {isVerifyingOtp
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.primaryBtnText}>Verify & Login</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp}>
                      <Text style={styles.resendText}>Resend OTP / Change number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              {authMethod === "password" && (
                <TouchableOpacity onPress={() =>
                  Alert.alert("Reset Password", "Please contact support to reset your password.")
                }>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
              <View style={styles.signupRow}>
                <Text style={styles.signupLabel}>Don't have an account? </Text>
                <TouchableOpacity onPress={() =>
                  router.push({ pathname: '/signup', params: { userType } })
                }>
                  <Text style={styles.signupAction}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
  },
  logoContainer: { alignItems: "center", marginTop: 32, marginBottom: 28 },
  logoText: { fontSize: 34, fontWeight: "bold", color: "#704214", letterSpacing: 1, fontFamily: "serif" },
  subtitleText: { fontSize: 15, color: APP_COLORS.gray, marginTop: 6 },
  formContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(112, 66, 20, 0.05)',
  },
  sectionWrap: { marginBottom: 18 },
  label: { fontSize: 13, color: APP_COLORS.gray, marginBottom: 8, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: {
    backgroundColor: APP_COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  toggleBtnText: { fontSize: 14, color: APP_COLORS.gray, fontWeight: '500' },
  toggleBtnTextActive: { color: APP_COLORS.primary, fontWeight: 'bold' },
  errorBanner: {
    backgroundColor: '#fff3f3',
    borderWidth: 1,
    borderColor: '#f5c6c6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: { color: '#c0392b', fontSize: 13, lineHeight: 18 },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  successText: { color: '#16a34a', fontSize: 13, fontWeight: '500' },
  devBanner: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  devText: { color: '#78350f', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: APP_COLORS.primary,
    height: 52,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: "bold", fontFamily: "serif" },
  disabledBtn: { opacity: 0.65 },
  hint: { fontSize: 12, color: APP_COLORS.gray, marginTop: 4, lineHeight: 18 },
  resendBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 4 },
  resendText: { color: APP_COLORS.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: APP_COLORS.lightGray },
  dividerLabel: { color: APP_COLORS.gray, fontSize: 13 },
  footer: { alignItems: 'center', gap: 14 },
  forgotText: { color: APP_COLORS.gray, fontSize: 14, textDecorationLine: 'underline' },
  signupRow: { flexDirection: 'row', alignItems: 'center' },
  signupLabel: { color: APP_COLORS.gray, fontSize: 14 },
  signupAction: { color: APP_COLORS.primary, fontSize: 15, fontWeight: 'bold', marginLeft: 4 },
});
