// Updated LoginScreen.js using the new components
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../redux/slices/authSlice';
import { APP_COLORS } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import ReligiousTraditionPicker from '../../components/ReligiousTraditionPicker';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [religiousTradition, setReligiousTradition] = useState('');
  const [templeAffiliation, setTempleAffiliation] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [showReligiousOptions, setShowReligiousOptions] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Validation Error', 'Please enter your phone number and password');
      return;
    }
    dispatch(login({ phone, password }));
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
              activeTab === 'login' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('login')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'login' && styles.activeTabText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'signup' && styles.activeTabButton,
            ]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'signup' && styles.activeTabText,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <InputField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          showTogglePassword={true}
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <TouchableOpacity
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
          value={religiousTradition}
          onChange={setReligiousTradition}
          isVisible={showReligiousOptions}
          onClose={() => setShowReligiousOptions(!showReligiousOptions)}
        />

        <InputField
          label="Temple Affiliation (Optional)"
          value={templeAffiliation}
          onChangeText={setTempleAffiliation}
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

export default LoginScreen;