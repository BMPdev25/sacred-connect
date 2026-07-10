import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';

import {
  DOCUMENT_SLOTS,
  DocumentSlotCard,
  step6Styles as styles,
  validateStep6Documents,
} from '@/components/priest/onboarding/steps/Step6.subcomponents';
import { THEME } from '@/constants/theme';
import { updateStep6Document } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { OnboardingService } from '@/services/priest/onboardingService';
import { DocumentSlot } from '@/types/priest.types';
import { StepRef } from '@/types/stepRef.types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Step 6 of the priest onboarding wizard.
 * Handles uploading required verification documents.
 */
export const Step6Documents = forwardRef<StepRef, {}>((_, ref) => {
  const dispatch = useDispatch();
  const uploadedDocs = useSelector((state: RootState) => state.onboarding.step6.documents);

  const [stepErrors, setStepErrors] = useState<string[]>([]);

  // Merge static slots with redux state
  const slots: DocumentSlot[] = DOCUMENT_SLOTS.map((slot) => {
    const uploaded = uploadedDocs.find((d) => d.type === slot.type);
    return uploaded ? { ...slot, ...uploaded } : slot;
  });

  async function handleDocumentPick(slot: DocumentSlot): Promise<void> {
    let fileUri = '';
    let fileName = '';
    let fileType = '';
    let fileSize = 0;

    try {
      if (slot.type === 'profile_photo') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = asset.fileName || `profile_${Date.now()}.jpg`;
        fileType = asset.mimeType || 'image/jpeg';
        fileSize = asset.fileSize || 0;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = asset.name;
        fileType = asset.mimeType || 'application/pdf';
        fileSize = asset.size || 0;
      }

      if (fileSize > MAX_FILE_SIZE_BYTES) {
        const fileSizeMb = (fileSize / (1024 * 1024)).toFixed(1);
        dispatch(
          updateStep6Document({
            type: slot.type,
            updates: {
              status: 'error',
              errorMessage: `File is ${fileSizeMb} MB — maximum allowed is 5 MB. Please choose a smaller file.`,
            },
          })
        );
        return;
      }

      // Start upload
      dispatch(
        updateStep6Document({
          type: slot.type,
          updates: { status: 'uploading', fileName, uploadProgress: 0 },
        })
      );

      // Simulate progress since Axios fetch doesn't natively expose it in our service
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress > 90) clearInterval(progressInterval);
        dispatch(
          updateStep6Document({
            type: slot.type,
            updates: { uploadProgress: Math.min(progress, 90) },
          })
        );
      }, 300);

      try {
        await OnboardingService.uploadDocument(slot.type, {
          uri: fileUri,
          name: fileName,
          type: fileType,
        });
      } finally {
        clearInterval(progressInterval);
      }
      
      setStepErrors([]);
    } catch (error: any) {
      console.error(`Failed to pick/upload document for ${slot.type}:`, error);
      dispatch(
        updateStep6Document({
          type: slot.type,
          updates: {
            status: 'error',
            errorMessage: error.message || 'Failed to upload document. Please try again.',
          },
        })
      );
    }
  }

  function handleRemoveDocument(slot: DocumentSlot): void {
    Alert.alert('Remove Document', `Are you sure you want to remove ${slot.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          dispatch(
            updateStep6Document({
              type: slot.type,
              updates: { status: 'empty', url: undefined, fileName: undefined, uploadProgress: 0 },
            })
          );
        },
      },
    ]);
  }

  function validate() {
    const errs = validateStep6Documents(slots);
    setStepErrors(errs);
    return errs;
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs = validate();
      return errs.length === 0;
    },
    validateStep6: () => {
      const errs = validate();
      return { isValid: errs.length === 0, errors: errs };
    },
  } as any));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.headerDescription}>
        Upload clear copies of your documents. These are required for verification and will be kept secure.
      </Text>

      {/* Validation Errors */}
      {stepErrors.map((err) => <Text key={err} style={styles.stepError}>{err}</Text>)}

      {/* Document Slots */}
      <View style={styles.slotsContainer}>
        {slots.map((slot) => (
          <DocumentSlotCard
            key={slot.type}
            slot={slot}
            onUpload={handleDocumentPick}
            onRemove={handleRemoveDocument}
          />
        ))}
      </View>

      {/* Support Line */}
      <View style={styles.supportContainer}>
        <Text style={styles.supportText}>Need help? Contact </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@sacredconnect.in')}>
          <Text style={styles.supportLink}>support@sacredconnect.in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

Step6Documents.displayName = 'Step6Documents';

