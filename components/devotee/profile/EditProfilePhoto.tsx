import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

interface EditProfilePhotoProps {
  /** Source object or resource identifier for the avatar image */
  profilePicSource: any;
  /** Flag showing if the image upload is currently in progress */
  isUploading: boolean;
  /** Fired when tapping on the photo wrapper or text caption */
  onPhotoChange: () => void;
}

/**
 * Avatar photo upload component with loading indicator overlay and camera badge.
 */
export function EditProfilePhoto({
  profilePicSource,
  isUploading,
  onPhotoChange,
}: EditProfilePhotoProps): React.JSX.Element {
  return (
    <View style={styles.photoSection}>
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={onPhotoChange}
        activeOpacity={0.8}
      >
        <Image source={profilePicSource} style={styles.avatar} />
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </View>
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={onPhotoChange} activeOpacity={0.7}>
        <Text style={styles.changePhotoCaption}>Tap to change photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.surface,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoCaption: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.body,
    fontWeight: '600',
    marginTop: THEME.spacing.sm,
  },
});
