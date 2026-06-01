import { useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';

import { RootState } from '@/redux/store';
import { updateUserProfile } from '@/redux/slices/userSlice';
import * as profileService from '@/services/user/profileService';
import { ProfileUpdatePayload } from '@/types/profile.types';

/**
 * Custom hook containing input state and update handlers for editing devotee profile.
 */
export function useEditProfile() {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress] = useState(0);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const isDirty = name !== user.name || phone !== user.phone;

  const handlePhotoChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setLocalPhotoUri(asset.uri);
      setIsUploading(true);

      const response = await profileService.uploadProfilePicture(
        asset.uri,
        asset.fileName ?? 'profile.jpg',
        asset.mimeType ?? 'image/jpeg'
      );

      const picUrl =
        typeof response.profilePicture === 'string'
          ? response.profilePicture
          : (response.profilePicture as any)?.url || '';
      dispatch(updateUserProfile({ profilePicture: picUrl }));

      if (Platform.OS === 'android') {
        ToastAndroid.show('Profile picture updated', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Profile picture updated');
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload: ProfileUpdatePayload = {};
    if (name.trim() !== user.name) {
      payload.name = name.trim();
    }
    if (phone !== user.phone) {
      payload.phone = phone;
    }

    try {
      const updated = await profileService.updateProfile(payload);
      dispatch(updateUserProfile(updated));

      if (Platform.OS === 'android') {
        ToastAndroid.show('Profile updated', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Profile updated');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    name,
    setName,
    phone,
    setPhone,
    isUploading,
    isSaving,
    uploadProgress,
    localPhotoUri,
    isDirty,
    handlePhotoChange,
    handleSave,
  };
}
