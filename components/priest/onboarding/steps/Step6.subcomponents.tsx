/**
 * Subcomponents and static configurations for Step 6 (Documents).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { DocumentSlot } from '@/types/priest.types';

export const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: 'profile_photo',
    label: 'Profile Photo',
    description: 'A clear headshot — this is shown to devotees',
    isRequired: true,
    isOptional: false,
    status: 'empty'
  },
  {
    type: 'government_id',
    label: 'Government ID',
    description: 'Aadhaar, PAN, Passport, or Voter ID',
    isRequired: true,
    isOptional: false,
    status: 'empty'
  },
  {
    type: 'religious_certificate',
    label: 'Priest Certification',
    description: 'Training certificate or credentials',
    isRequired: true,
    isOptional: false,
    status: 'empty'
  },
  {
    type: 'other',
    label: 'Additional Certificate',
    description: 'Any other supporting document (optional)',
    isRequired: false,
    isOptional: true,
    status: 'empty'
  }
];

interface DocumentSlotCardProps {
  slot: DocumentSlot;
  onUpload: (slot: DocumentSlot) => void;
  onRemove: (slot: DocumentSlot) => void;
}

export function DocumentSlotCard({ slot, onUpload, onRemove }: DocumentSlotCardProps): React.ReactElement {
  if (slot.status === 'uploading') {
    return (
      <View style={[styles.cardBase, styles.cardUploading]}>
        <View style={styles.uploadingRow}>
          <Ionicons name="document-text-outline" size={24} color={THEME.colors.primary} />
          <Text style={styles.filenameText} numberOfLines={1} ellipsizeMode="middle">
            {slot.fileName || 'Uploading...'}
          </Text>
          <Text style={styles.progressText}>{slot.uploadProgress || 0}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${slot.uploadProgress || 0}%` }]} />
        </View>
      </View>
    );
  }

  if (slot.status === 'uploaded') {
    return (
      <View style={[styles.cardBase, styles.cardUploaded]}>
        <Ionicons name="checkmark-circle" size={24} color={THEME.colors.success} />
        <View style={styles.uploadedTextContainer}>
          <Text style={styles.slotLabel}>{slot.label}</Text>
          <Text style={styles.filenameText} numberOfLines={1} ellipsizeMode="middle">
            {slot.fileName || 'Document uploaded'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(slot)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={24} color={THEME.colors.error} />
        </TouchableOpacity>
      </View>
    );
  }

  if (slot.status === 'error') {
    return (
      <TouchableOpacity style={[styles.cardBase, styles.cardError]} onPress={() => onUpload(slot)}>
        <Ionicons name="alert-circle-outline" size={32} color={THEME.colors.error} />
        <View style={styles.errorTextContainer}>
          <Text style={styles.slotLabel}>{slot.label}</Text>
          <Text style={styles.errorText}>{slot.errorMessage || 'Upload failed. Tap to retry.'}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // status === 'empty'
  return (
    <TouchableOpacity style={[styles.cardBase, styles.cardEmpty]} onPress={() => onUpload(slot)}>
      {slot.isOptional && (
        <View style={styles.optionalBadge}>
          <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
        </View>
      )}
      <Ionicons name="cloud-upload-outline" size={32} color={THEME.colors.primary} />
      <Text style={styles.uploadLabel}>{slot.label}</Text>
      <Text style={styles.uploadDescription}>{slot.description}</Text>
      <Text style={styles.uploadLimitText}>Max file size: 5 MB · JPG, PNG or PDF</Text>
    </TouchableOpacity>
  );
}

export function validateStep6Documents(slots: DocumentSlot[]): string[] {
  const errs: string[] = [];
  let hasEmptyRequired = false;
  let hasUploading = false;

  for (const slot of slots) {
    if (slot.isRequired && (slot.status === 'empty' || slot.status === 'error')) {
      hasEmptyRequired = true;
    }
    if (slot.status === 'uploading') {
      hasUploading = true;
    }
  }

  if (hasEmptyRequired) {
    errs.push('Please upload all required documents');
  }
  if (hasUploading) {
    errs.push('Please wait for uploads to complete');
  }

  return errs;
}

export const styles = StyleSheet.create({
  cardBase: {
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    justifyContent: 'center',
  },
  cardEmpty: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  cardUploading: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    ...THEME.shadow.card,
  },
  cardUploaded: {
    backgroundColor: THEME.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    ...THEME.shadow.card,
  },
  cardError: {
    backgroundColor: THEME.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.error,
  },
  optionalBadge: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    backgroundColor: THEME.colors.textMuted,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
  },
  optionalBadgeText: {
    color: THEME.colors.surface,
    fontSize: THEME.typography.caption,
    fontWeight: '700',
  },
  uploadLabel: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.subheading,
    fontWeight: '600',
    marginTop: THEME.spacing.xs,
  },
  uploadDescription: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.typography.bodySmall,
    textAlign: 'center',
    marginTop: 4,
  },
  uploadLimitText: {
    color: THEME.colors.textMuted,
    fontSize: THEME.typography.caption,
    textAlign: 'center',
    marginTop: 6,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  filenameText: {
    flex: 1,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
  },
  progressText: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
  },
  uploadedTextContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  slotLabel: {
    fontSize: THEME.typography.bodySmall,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  errorText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.error,
    fontWeight: '500',
  },
});

export const step6Styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  headerDescription: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  stepError: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.error,
  },
  slotsContainer: {
    gap: THEME.spacing.sm,
  },
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
  },
  supportText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
  },
  supportLink: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
