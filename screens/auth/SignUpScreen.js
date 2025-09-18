// Updated SignUpScreen.js using the new components
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
import { register, clearError } from '../../redux/slices/authSlice';
import { APP_COLORS } from '../../config';
import InputField from '../../components/InputField';
import ReligiousTraditionPicker from '../../components/ReligiousTraditionPicker';



const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('devotee');
  const [religiousTradition, setReligiousTradition] = useState('');
  const [showReligiousOptions, setShowReligiousOptions] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = () => {
    const newErrors = {};

    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, '')))
      newErrors.phone = 'Phone number must be 10 digits';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (userType === 'priest' && !religiousTradition)
      newErrors.religiousTradition = 'Please select your religious tradition';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (validateForm()) {
      dispatch(register({
        name,
        email,
        phone,
        password,
        userType,
        religiousTradition: userType === 'priest' ? religiousTradition : undefined
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
            onPress={() => navigation.navigate('Login')}
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
                userType === 'devotee' && styles.activeUserTypeButton,
              ]}
              onPress={() => setUserType('devotee')}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  userType === 'devotee' && styles.activeUserTypeButtonText,
                ]}
              >
                Devotee
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'priest' && styles.activeUserTypeButton,
              ]}
              onPress={() => setUserType('priest')}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  userType === 'priest' && styles.activeUserTypeButtonText,
                ]}
              >
                Priest
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InputField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          error={errors.name}
        />

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <InputField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry={!showPassword}
          showTogglePassword={true}
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password}
        />

        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry={!showPassword}
          error={errors.confirmPassword}
        />

        {userType === 'priest' && (
          <ReligiousTraditionPicker
            value={religiousTradition}
            onChange={setReligiousTradition}
            isVisible={showReligiousOptions}
            onClose={() => setShowReligiousOptions(!showReligiousOptions)}
            error={errors.religiousTradition}
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

export default SignUpScreen;