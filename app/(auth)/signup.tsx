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
import { register, clearError } from '../../redux/slices/authSlice';
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


type UserType = 'devotee' | 'priest';

interface SignUpState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  userType: UserType;
  religiousTradition: string;
  showReligiousOptions: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  religiousTradition?: string;
}

export default function SignUpScreen() {
  const [state, setState] = useState<SignUpState>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    userType: 'devotee',
    religiousTradition: '',
    showReligiousOptions: false,
  });

  // Form validation
  const [errors, setErrors] = useState<FormErrors>({});

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!state.name) newErrors.name = 'Name is required';
    if (!state.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(state.email)) newErrors.email = 'Email is invalid';

    if (!state.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(state.phone.replace(/\D/g, '')))
      newErrors.phone = 'Phone number must be 10 digits';

    if (!state.password) newErrors.password = 'Password is required';
    else if (state.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!state.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (state.password !== state.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (state.userType === 'priest' && !state.religiousTradition)
      newErrors.religiousTradition = 'Please select your religious tradition';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = (): void => {
    if (validateForm()) {
      dispatch(register({
        name: state.name,
        email: state.email,
        phone: state.phone,
        password: state.password,
        userType: state.userType,
        // religiousTradition: state.userType === 'priest' ? state.religiousTradition : undefined
      }));
    }
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
            style={styles.tabButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.tabText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, styles.activeTabButton]}
          >
            <Text style={[styles.tabText, styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userTypeContainer}>
          <Text style={styles.sectionTitle}>I am a:</Text>
          <View style={styles.userTypeButtons}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                state.userType === 'devotee' && styles.activeUserTypeButton,
              ]}
              onPress={() => setState(prev => ({ ...prev, userType: 'devotee' }))}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  state.userType === 'devotee' && styles.activeUserTypeButtonText,
                ]}
              >
                Devotee
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                state.userType === 'priest' && styles.activeUserTypeButton,
              ]}
              onPress={() => setState(prev => ({ ...prev, userType: 'priest' }))}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  state.userType === 'priest' && styles.activeUserTypeButtonText,
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
          onChangeText={(text: string) => setState(prev => ({ ...prev, name: text }))}
          placeholder="Enter your full name"
          error={errors.name}
        />

        <InputField
          label="Email"
          value={state.email}
          onChangeText={(text: string) => setState(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <InputField
          label="Phone Number"
          value={state.phone}
          onChangeText={(text: string) => setState(prev => ({ ...prev, phone: text }))}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <InputField
          label="Password"
          value={state.password}
          onChangeText={(text: string) => setState(prev => ({ ...prev, password: text }))}
          placeholder="Create a password"
          secureTextEntry={!state.showPassword}
          showTogglePassword={true}
          passwordVisible={state.showPassword}
          onTogglePassword={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
          error={errors.password}
        />

        <InputField
          label="Confirm Password"
          value={state.confirmPassword}
          onChangeText={(text: string) => setState(prev => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm your password"
          secureTextEntry={!state.showPassword}
          error={errors.confirmPassword}
        />

        {state.userType === 'priest' && (
          <ReligiousTraditionPicker
            value={state.religiousTradition}
            onChange={(value: string) => setState(prev => ({ ...prev, religiousTradition: value }))}
            isVisible={state.showReligiousOptions}
            onClose={() => setState(prev => ({ ...prev, showReligiousOptions: !prev.showReligiousOptions }))}
            // error={errors.religiousTradition ||}
          />
        )}

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.signUpButtonText}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>
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
  userTypeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: APP_COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  signUpButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 8,
  },
});