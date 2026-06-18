import { useState, useEffect } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import api from '@/api/index';
import { RootState } from '@/redux/store';
import { updateUserProfile } from '@/redux/slices/userSlice';
import { CalendarService } from '@/services/priest/calendarService';
import * as profileService from '@/services/user/profileService';

/**
 * Custom hook containing input state and save handlers for editing a priest profile.
 */
export function useEditPriestProfile() {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: priestProfile } = useQuery({
    queryKey: ['myPriestProfile'],
    queryFn: CalendarService.fetchPriestProfile,
    staleTime: 300000,
  });

  const { data: allLanguages } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const res = await api.get('/languages');
      return res.data;
    },
    staleTime: 86400000,
  });

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  // Sync state with fetched query details
  useEffect(() => {
    if (user.name) setName(user.name);
    if (user.phone) setPhone(user.phone);
  }, [user.name, user.phone]);

  useEffect(() => {
    if (priestProfile) {
      setBio(priestProfile.description ?? '');
      setExperienceYears(priestProfile.experience ?? 1);
      if (priestProfile.userId?.languagesSpoken) {
        const langs = priestProfile.userId.languagesSpoken.map((l: any) =>
          typeof l === 'string' ? l : l.name
        );
        setSelectedLanguages(langs);
      }
    }
  }, [priestProfile]);

  const initialLangs = priestProfile?.userId?.languagesSpoken?.map((l: any) =>
    typeof l === 'string' ? l : l.name
  ) || [];
  const langsChanged =
    JSON.stringify([...selectedLanguages].sort()) !== JSON.stringify([...initialLangs].sort());

  const isDirty =
    name !== user.name ||
    phone !== user.phone ||
    bio !== (priestProfile?.description ?? '') ||
    experienceYears !== (priestProfile?.experience ?? 1) ||
    langsChanged;

  const handleLanguageToggle = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handlePhotoChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

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
      showToast('Profile picture updated');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const validateInputs = (): boolean => {
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return false;
    }
    if (phone.length < 10) {
      Alert.alert('Error', 'Phone number must be at least 10 digits');
      return false;
    }
    if (bio.trim().length < 50) {
      Alert.alert('Error', 'About/Bio must be at least 50 characters');
      return false;
    }
    if (selectedLanguages.length === 0) {
      Alert.alert('Error', 'Select at least one language');
      return false;
    }
    return true;
  };

  const getUserUpdates = (langsChanged: boolean, languageIds: string[]) => {
    const updates: any = {};
    if (name.trim() !== user.name) updates.name = name.trim();
    if (phone !== user.phone) updates.phone = phone;
    if (langsChanged) updates.languagesSpoken = languageIds;
    return updates;
  };

  const getPriestUpdates = () => {
    const updates: any = {};
    if (bio.trim() !== (priestProfile?.description ?? '')) {
      updates.description = bio.trim();
    }
    if (experienceYears !== priestProfile?.experience) {
      updates.experience = experienceYears;
    }
    return updates;
  };

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', msg);
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    try {
      const promises = [];
      const languageIds = selectedLanguages
        .map((name) => allLanguages?.find((l: any) => l.name === name)?._id)
        .filter(Boolean);

      const userUpdates = getUserUpdates(langsChanged, languageIds);
      if (Object.keys(userUpdates).length > 0) {
        promises.push(profileService.updateProfile(userUpdates));
      }

      const priestUpdates = getPriestUpdates();
      if (Object.keys(priestUpdates).length > 0) {
        promises.push(CalendarService.updatePriestProfile(priestUpdates));
      }

      await Promise.all(promises);

      queryClient.invalidateQueries({ queryKey: ['myPriestProfile'] });
      // Invalidate public-facing caches so devotees see updated prices/details immediately
      queryClient.invalidateQueries({ queryKey: ['priestProfile'] });
      queryClient.invalidateQueries({ queryKey: ['availablePriests'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyPriests'] });
      dispatch(updateUserProfile({ name: name.trim(), phone }));

      showToast('Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    priestProfile,
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
  };
}
