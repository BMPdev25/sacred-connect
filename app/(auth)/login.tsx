import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { login, clearError } from '../../redux/slices/authSlice';
import InputField from '../../components/InputField';
import ReligiousTraditionPicker from '../../components/ReligiousTraditionPicker';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';
const APP_COLORS = {
  primary: Colors.light.tint,
  secondary: Colors.light.tabIconDefault,
  white: Colors.light.background,
  black: Colors.light.text,
  lightGray: '#eee',
  gray: '#6b6b6b',
  error: '#cc0000',
  background: Colors.light.background,
};

interface LoginState {
  phone: string;
  password: string;
  showPassword: boolean;
  religiousTradition: string;
  templeAffiliation: string;
  activeTab: 'login' | 'signup';
  showReligiousOptions: boolean;
}

export default function LoginScreen() {
  const [state, setState] = useState<LoginState>({
    phone: '',
    password: '',
    showPassword: false,
    religiousTradition: '',
    templeAffiliation: '',
    activeTab: 'login',
    showReligiousOptions: false,
  });

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = (): void => {
    if (!state.phone || !state.password) {
      Alert.alert('Validation Error', 'Please enter your phone number and password');
      return;
    }
    dispatch(login({ phone: state.phone, password: state.password }));
  };

  return (
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
              state.activeTab === 'login' && styles.activeTabButton,
            ]}
            onPress={() => setState(prev => ({ ...prev, activeTab: 'login' }))}
          >
            <Text
              style={[
                styles.tabText,
                state.activeTab === 'login' && styles.activeTabText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              state.activeTab === 'signup' && styles.activeTabButton,
            ]}
            onPress={() => router.push('/signup')}
          >
            <Text
              style={[
                styles.tabText,
                state.activeTab === 'signup' && styles.activeTabText,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

          <InputField
            label="Phone Number"
            value={state.phone}
            onChangeText={(text: string) => setState(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Password"
            value={state.password}
            onChangeText={(text: string) => setState(prev => ({ ...prev, password: text }))}
            placeholder="Enter your password"
            secureTextEntry={!state.showPassword}
            showTogglePassword={true}
            passwordVisible={state.showPassword}
            onTogglePassword={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
          />        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Additional Information</Text>
          <View style={styles.dividerLine} />
        </View>

        <ReligiousTraditionPicker
          value={state.religiousTradition}
          onChange={(value: string) => setState(prev => ({ ...prev, religiousTradition: value }))}
          isVisible={state.showReligiousOptions}
          onClose={() => setState(prev => ({ ...prev, showReligiousOptions: !prev.showReligiousOptions }))}
        />

        <InputField
          label="Temple Affiliation (Optional)"
          value={state.templeAffiliation}
          onChangeText={(text: string) => setState(prev => ({ ...prev, templeAffiliation: text }))}
          placeholder="Enter your temple affiliation"
        />

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => Alert.alert('Reset Password', 'Please contact support to reset your password.')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  contentContainer: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoText: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
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
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  loginButton: {
    backgroundColor: APP_COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loginButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: APP_COLORS.primary,
    fontSize: 14,
  },
});