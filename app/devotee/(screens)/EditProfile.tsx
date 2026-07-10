import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';
import FloatingInput from '@/components/shared/FloatingInput';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { useEditProfile } from '@/components/devotee/profile/useEditProfile';
import { EditProfilePhoto } from '@/components/devotee/profile/EditProfilePhoto';

/**
 * Devotee Edit Profile screen allowing name and phone modifications,
 * profile photo uploads, and showing verified email status.
 */
export default function EditProfile(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    user,
    name,
    setName,
    phone,
    setPhone,
    isUploading,
    isSaving,
    localPhotoUri,
    isDirty,
    handlePhotoChange,
    handleSave,
  } = useEditProfile();

  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');
  const profilePicSource = localPhotoUri
    ? { uri: localPhotoUri }
    : (user.profilePicture ? { uri: user.profilePicture } : avatarPlaceholder);

  const verifiedIcon = (
    <View style={styles.verifiedContainer}>
      <Ionicons
        name="lock-closed"
        size={14}
        color="#16A34A"
        style={styles.lockIcon}
      />
      <Text style={styles.verifiedText}>Verified</Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      {/* ABSOLUTE BACK BUTTON */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={80}
      >
        <Text style={styles.screenTitle}>Edit Profile</Text>

        {/* PHOTO SECTION */}
        <EditProfilePhoto
          profilePicSource={profilePicSource}
          isUploading={isUploading}
          onPhotoChange={handlePhotoChange}
        />

        {/* FORM CARD */}
        <View style={styles.formCard}>
          <FloatingInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            leftIcon={<Ionicons name="person-outline" size={20} color={THEME.colors.textMuted} />}
            isValid={name.trim().length >= 2 && name !== user.name}
            editable={true}
          />

          <View style={styles.divider} />

          <FloatingInput
            label="Email"
            value={user.email}
            onChangeText={() => {}}
            editable={false}
            leftIcon={<Ionicons name="mail-outline" size={20} color={THEME.colors.textMuted} />}
            rightIcon={verifiedIcon}
          />

          <View style={styles.divider} />

          <FloatingInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            leftIcon={<Ionicons name="phone-portrait-outline" size={20} color={THEME.colors.textMuted} />}
            keyboardType="phone-pad"
            isValid={phone.length >= 10 && phone !== user.phone}
            editable={true}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* STICKY BOTTOM BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, THEME.spacing.md) }]}>
        <PrimaryButton
          title="Save Changes"
          disabled={!isDirty || isSaving}
          loading={isSaving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  screenTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  formCard: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.card,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.sm,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: THEME.spacing.xs,
  },
  verifiedText: {
    color: '#16A34A',
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
