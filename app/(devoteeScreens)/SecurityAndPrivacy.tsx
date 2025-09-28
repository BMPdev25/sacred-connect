import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { APP_COLORS } from '../../constants/Colors';
import { AppDispatch, RootState } from '../../redux/store';
import userService from '../../services/userService';

const EnhancedSecurityPrivacyScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  // Security State
  const [securitySettings, setSecuritySettings] = useState<{ twoFactorEnabled: boolean; lastPasswordChange: string | null }>({
    twoFactorEnabled: false,
    lastPasswordChange: null,
  });
  
  // Privacy State
  const [privacySettings, setPrivacySettings] = useState<{
    profileVisibility: string;
    showPhoneNumber: boolean;
    showEmail: boolean;
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
  }>({
    profileVisibility: 'public',
    showPhoneNumber: true,
    showEmail: false,
    dataProcessingConsent: true,
    marketingConsent: false,
  });

  // Modal States
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete Account Form
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmationText: '',
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success) {
        setSecuritySettings(response.data.security || securitySettings);
        setPrivacySettings(response.data.privacy || privacySettings);
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Update security settings
      setSecuritySettings(prev => ({
        ...prev,
        lastPasswordChange: new Date().toISOString(),
      }));
    } catch (error: unknown) {
      Alert.alert('Error', (error as any)?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityToggle = async (setting: keyof typeof securitySettings, value: boolean) => {
    try {
      const updatedSettings = { ...securitySettings, [setting]: value };
      await userService.updateSecuritySettings({ [setting]: value });
      setSecuritySettings(updatedSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings');
    }
  };

  const handlePrivacyToggle = async (setting: keyof typeof privacySettings, value: any) => {
    try {
      const updatedSettings = { ...privacySettings, [setting]: value };
      await userService.updatePrivacySettings({ [setting]: value });
      setPrivacySettings(updatedSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteForm.confirmationText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. Your account and all data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await userService.deleteAccount(deleteForm.password, deleteForm.confirmationText);
              Alert.alert('Success', 'Account deleted successfully', [
                { text: 'OK', onPress: () => router.push('/login') }
              ]);
            } catch (error: unknown) {
                      Alert.alert('Error', (error as any)?.response?.data?.message ?? 'Failed to delete account');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatLastPasswordChange = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const insets = useSafeAreaInsets();

  return (
      <SafeAreaView style={styles.container} edges={["top","left","right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }] }>
        {/* <TouchableOpacity onPress={() => router.push('/devotee/ProfileTab')}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Security & Privacy</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="key-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Change Password</Text>
                <Text style={styles.menuItemSubtitle}>
                  Last changed: {formatLastPasswordChange(securitySettings.lastPasswordChange)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Two-Factor Authentication</Text>
                <Text style={styles.menuItemSubtitle}>
                  Add extra security to your account
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.twoFactorEnabled}
              onValueChange={(value) => handleSecurityToggle('twoFactorEnabled', value)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '40' }}
              thumbColor={securitySettings.twoFactorEnabled ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="eye-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Profile Visibility</Text>
                <Text style={styles.menuItemSubtitle}>
                  Currently: {privacySettings.profileVisibility}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
              // Show profile visibility options
              Alert.alert('Profile Visibility', 'Choose who can see your profile', [
                { text: 'Public', onPress: () => handlePrivacyToggle('profileVisibility', 'public') },
                { text: 'Limited', onPress: () => handlePrivacyToggle('profileVisibility', 'limited') },
                { text: 'Private', onPress: () => handlePrivacyToggle('profileVisibility', 'private') },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}>
              <Ionicons name="chevron-forward" size={20} color={APP_COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="call-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Show Phone Number</Text>
                <Text style={styles.menuItemSubtitle}>
                  Allow others to see your phone number
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.showPhoneNumber}
              onValueChange={(value) => handlePrivacyToggle('showPhoneNumber', value)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '40' }}
              thumbColor={privacySettings.showPhoneNumber ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Show Email Address</Text>
                <Text style={styles.menuItemSubtitle}>
                  Allow others to see your email
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.showEmail}
              onValueChange={(value) => handlePrivacyToggle('showEmail', value)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '40' }}
              thumbColor={privacySettings.showEmail ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
        </View>

        {/* Data & Marketing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Marketing</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Data Processing</Text>
                <Text style={styles.menuItemSubtitle}>
                  Allow us to process your data for app functionality
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.dataProcessingConsent}
              onValueChange={(value) => handlePrivacyToggle('dataProcessingConsent', value)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '40' }}
              thumbColor={privacySettings.dataProcessingConsent ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="megaphone-outline" size={24} color={APP_COLORS.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Marketing Communications</Text>
                <Text style={styles.menuItemSubtitle}>
                  Receive promotional emails and offers
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.marketingConsent}
              onValueChange={(value) => handlePrivacyToggle('marketingConsent', value)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '40' }}
              thumbColor={privacySettings.marketingConsent ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: APP_COLORS.error }]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]}
            onPress={() => setDeleteAccountModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash-outline" size={24} color={APP_COLORS.error} />
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: APP_COLORS.error }]}>
                  Delete Account
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  Permanently delete your account and all data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                secureTextEntry
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                secureTextEntry
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
              />

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handlePasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={APP_COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteAccountModalVisible}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: APP_COLORS.error }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteAccountModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.warningText}>
              This action cannot be undone. All your data, bookings, and account information will be permanently deleted.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={deleteForm.password}
                onChangeText={(text) => setDeleteForm(prev => ({ ...prev, password: text }))}
              />
              
              <TextInput
                style={styles.input}
                placeholder='Type "DELETE" to confirm'
                value={deleteForm.confirmationText}
                onChangeText={(text) => setDeleteForm(prev => ({ ...prev, confirmationText: text }))}
              />

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: APP_COLORS.error }]}
                onPress={handleDeleteAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={APP_COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: APP_COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.error + '20',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: APP_COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  dangerItem: {
    borderColor: APP_COLORS.error + '30',
    backgroundColor: APP_COLORS.error + '05',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    color: APP_COLORS.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EnhancedSecurityPrivacyScreen;
