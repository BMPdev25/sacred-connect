import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { RootState } from '@/redux/store';
import { AssetService } from '@/services/assets/AssetService';
import { formatDate } from '@/utils/dateUtils';
import { MenuSectionLabel } from '@/components/devotee/profile/MenuSectionLabel';
import { MenuCard } from '@/components/devotee/profile/MenuCard';
import { MenuRow } from '@/components/devotee/profile/MenuRow';
import { useProfileActions } from '@/components/devotee/profile/useProfileActions';

/**
 * Devotee Profile Screen Tab component.
 * Displays user identity summary, settings, and support links.
 */
export default function ProfileTab(): React.JSX.Element {
  const user = useSelector((state: RootState) => state.user);
  const {
    handleEditProfile,
    handleManageAddresses,
    handleNotificationSettings,
    handleHelpSupport,
    handleTerms,
    handlePrivacy,
    handleRateApp,
    handleShareApp,
    handleLogOut,
  } = useProfileActions();

  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');
  const profilePicSource = user.profilePicture ? { uri: user.profilePicture } : avatarPlaceholder;
  const memberSinceText = user.createdAt
    ? `Member since ${formatDate(user.createdAt, 'monthYear')}`
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        
        {/* USER IDENTITY SECTION */}
        <View style={styles.identitySection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Image source={profilePicSource} style={styles.avatar} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name || 'Sacred User'}</Text>
          <Text style={styles.userEmail}>{user.email || ''}</Text>
          {!!memberSinceText && <Text style={styles.memberSince}>{memberSinceText}</Text>}
        </View>

        {/* ACCOUNT SECTION */}
        <MenuSectionLabel label="Account" />
        <MenuCard>
          <MenuRow
            iconName="person-outline"
            label="Edit Profile"
            onPress={handleEditProfile}
            hasDivider
          />
          <MenuRow
            iconName="location-outline"
            label="Manage Addresses"
            onPress={handleManageAddresses}
          />
        </MenuCard>

        {/* PREFERENCES SECTION */}
        <MenuSectionLabel label="Preferences" />
        <MenuCard>
          <MenuRow
            iconName="notifications-outline"
            label="Notification Settings"
            onPress={handleNotificationSettings}
          />
        </MenuCard>

        {/* SUPPORT SECTION */}
        <MenuSectionLabel label="Support" />
        <MenuCard>
          <MenuRow
            iconName="help-circle-outline"
            label="Help & Support"
            onPress={handleHelpSupport}
            hasDivider
          />
          <MenuRow
            iconName="star-outline"
            label="Rate the App"
            onPress={handleRateApp}
            isExternal
            hasDivider
          />
          <MenuRow
            iconName="share-social-outline"
            label="Share the App"
            onPress={handleShareApp}
            isExternal
          />
        </MenuCard>

        {/* LEGAL SECTION */}
        <MenuSectionLabel label="Legal" />
        <MenuCard>
          <MenuRow
            iconName="document-text-outline"
            label="Terms of Service"
            onPress={handleTerms}
            hasDivider
          />
          <MenuRow
            iconName="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={handlePrivacy}
          />
        </MenuCard>

        {/* LOG OUT SECTION */}
        <View style={styles.logoutContainer}>
          <MenuCard>
            <MenuRow
              iconName="log-out-outline"
              label="Log Out"
              onPress={handleLogOut}
              isDestructive
            />
          </MenuCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.xl,
  },
  identitySection: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: THEME.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.surface,
  },
  userName: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  memberSince: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  logoutContainer: {
    marginTop: THEME.spacing.lg,
  },
});
