import { Alert, Linking, Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';

import * as authService from '@/services/auth/authService';

/**
 * Custom hook containing navigation and action handlers for the Devotee Profile tab.
 * Ensures the main UI component file remains clean and within line count limits.
 */
export function useProfileActions() {
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/devotee/(screens)/EditProfile' as any);
  };

  const handleManageAddresses = () => {
    router.push('/devotee/(screens)/ManageAddresses' as any);
  };

  const handleNotificationSettings = () => {
    router.push('/devotee/(screens)/NotificationPreferences' as any);
  };

  const handleHelpSupport = () => {
    router.push('/devotee/(screens)/HelpSupport' as any);
  };

  const handleTerms = () => {
    router.push({
      pathname: '/devotee/(screens)/TermsPrivacy' as any,
      params: { type: 'terms' },
    });
  };

  const handlePrivacy = () => {
    router.push({
      pathname: '/devotee/(screens)/TermsPrivacy' as any,
      params: { type: 'privacy' },
    });
  };

  const handleRateApp = async () => {
    try {
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id647382910?action=write-review'
        : 'market://details?id=com.bookmypujari';
      await Linking.openURL(storeUrl);
    } catch (err) {
      console.warn('Failed to open store URL', err);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Experience premium divine services! Download Sacred Connect to book verified pandits for religious ceremonies: https://play.google.com/store/apps/details?id=com.bookmypujari',
        title: 'Share Sacred Connect',
      });
    } catch (err) {
      console.warn('Failed to share app', err);
    }
  };

  const confirmLogOut = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Sign-out error', err);
    }
  };

  const handleLogOut = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: confirmLogOut },
      ]
    );
  };

  return {
    handleEditProfile,
    handleManageAddresses,
    handleNotificationSettings,
    handleHelpSupport,
    handleTerms,
    handlePrivacy,
    handleRateApp,
    handleShareApp,
    handleLogOut,
  };
}
