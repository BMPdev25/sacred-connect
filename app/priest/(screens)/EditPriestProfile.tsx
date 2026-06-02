import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { THEME } from '@/constants/theme';
import { AssetService } from '@/services/assets/AssetService';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { EditProfilePhoto } from '@/components/devotee/profile/EditProfilePhoto';
import { useEditPriestProfile } from '@/components/priest/useEditPriestProfile';
import { EditPriestProfileForm } from '@/components/priest/EditPriestProfileForm';

function getProfilePictureUrl(pic: any): string | null {
  if (!pic) return null;
  if (typeof pic === 'string') return pic;
  if (typeof pic === 'object' && pic.url) return pic.url;
  return null;
}

/**
 * Screen enabling priests to modify their name, contact number, avatar photo,
 * spiritual biography details, experience duration, and spoken languages.
 */
export default function EditPriestProfile(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    user,
    name,
    setName,
    phone,
    setPhone,
    bio,
    setBio,
    experienceYears,
    setExperienceYears,
    selectedLanguages,
    isUploading,
    isSaving,
    localPhotoUri,
    isDirty,
    handleLanguageToggle,
    handlePhotoChange,
    handleSave,
  } = useEditPriestProfile();

  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');
  const userPhotoUrl = getProfilePictureUrl(user.profilePicture);
  const profilePicSource = localPhotoUri
    ? { uri: localPhotoUri }
    : (userPhotoUrl ? { uri: userPhotoUrl } : avatarPlaceholder);

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Edit Profile</Text>

        {/* PHOTO SECTION */}
        <EditProfilePhoto
          profilePicSource={profilePicSource}
          isUploading={isUploading}
          onPhotoChange={handlePhotoChange}
        />

        {/* FORM */}
        <EditPriestProfileForm
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={user.email}
          bio={bio}
          setBio={setBio}
          experienceYears={experienceYears}
          setExperienceYears={setExperienceYears}
          selectedLanguages={selectedLanguages}
          onLanguageToggle={handleLanguageToggle}
        />
      </ScrollView>

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
    paddingBottom: THEME.spacing.xl,
  },
  screenTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  bottomBar: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
