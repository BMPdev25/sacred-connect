// src/screens/devotee/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateProfile, loadUser } from '../../redux/slices/authSlice';
import { APP_COLORS } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import SecurityPrivacyScreen from './SecurityPrivacyScreen';

const HEADER_TOP_PADDING = Platform.OS === 'android' ? (Platform.constants && Platform.constants.StatusBarHeight) || 24 : 44;

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState(userInfo?.name || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');

  // Notification preferences
  const [notifyUpcomingBookings, setNotifyUpcomingBookings] = useState(true);
  const [notifyBookingConfirmations, setNotifyBookingConfirmations] = useState(true);
  const [notifyPromotions, setNotifyPromotions] = useState(false);

  // Security & Privacy Modal
  const [securityModalVisible, setSecurityModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => dispatch(logout()),
        },
      ],
      { cancelable: false }
    );
  };

  const handleSaveProfile = () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // In a real app, this would dispatch an API call to update the profile
    // For now, we'll just update the local state
    dispatch(updateProfile({
      name,
      email,
      phone,
    })).then((result) => {
      if (!result.error) {
        // Ensures latest profile is loaded after update
        dispatch(loadUser());
        setIsEditMode(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    });
  };

  return (
    <View style={styles.container}>
  <ExpoStatusBar style="dark" backgroundColor={APP_COLORS.white} />
      <View style={[styles.header, { paddingTop: HEADER_TOP_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4, borderBottomWidth: 1, borderBottomColor: APP_COLORS.lightGray }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Help')}>
          <Ionicons name="help-circle-outline" size={24} color={APP_COLORS.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <Image
            source={require('../../assets/default-profile.png')}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{userInfo?.name || 'User Name'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userInfo?.email || 'email@example.com'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userInfo?.phone || '+91 XXXXX XXXXX'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>Upcoming Bookings</Text>
              <Text style={styles.notificationDescription}>
                Receive reminders for your upcoming ceremonies
              </Text>
            </View>
            <Switch
              value={notifyUpcomingBookings}
              onValueChange={setNotifyUpcomingBookings}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '80' }}
              thumbColor={notifyUpcomingBookings ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>Booking Confirmations</Text>
              <Text style={styles.notificationDescription}>
                Receive notifications for booking confirmations and updates
              </Text>
            </View>
            <Switch
              value={notifyBookingConfirmations}
              onValueChange={setNotifyBookingConfirmations}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '80' }}
              thumbColor={notifyBookingConfirmations ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>Promotions & News</Text>
              <Text style={styles.notificationDescription}>
                Receive updates about promotions and new features
              </Text>
            </View>
            <Switch
              value={notifyPromotions}
              onValueChange={setNotifyPromotions}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '80' }}
              thumbColor={notifyPromotions ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.accountOption} onPress={() => navigation.navigate('SecurityPrivacy')}>
            <Ionicons name="shield-checkmark-outline" size={24} color={APP_COLORS.primary} />
            <Text style={styles.accountOptionText}>Security & Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountOption} onPress={() => navigation.navigate('PaymentMethods')}>
            <Ionicons name="card-outline" size={24} color={APP_COLORS.primary} />
            <Text style={styles.accountOptionText}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountOption}
            onPress={() => navigation.navigate('Help')}
          >
            <Ionicons name="help-circle-outline" size={24} color={APP_COLORS.primary} />
            <Text style={styles.accountOptionText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountOption} onPress={() => navigation.navigate('TermsAndConditions')}>
            <Ionicons name="document-text-outline" size={24} color={APP_COLORS.primary} />
            <Text style={styles.accountOptionText}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={APP_COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Sacred Connect v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
    // Top padding is now handled dynamically
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  editProfileButton: {
    position: 'absolute',
    top: 96,
    right: '50%',
    marginRight: -50,
    backgroundColor: APP_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: APP_COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editNameContainer: {
    width: '80%',
  },
  editNameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.primary,
    paddingVertical: 4,
  },
  section: {
    backgroundColor: APP_COLORS.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 10,
    padding: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary + '20',
  },
  editButtonText: {
    fontSize: 12,
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  editContainer: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
  },
  cancelButtonText: {
    color: APP_COLORS.gray,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  accountOptionText: {
    marginLeft: 16,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.error,
  },
  logoutButtonText: {
    marginLeft: 8,
    color: APP_COLORS.error,
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  versionText: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
});

export default ProfileScreen;