import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface RateReviewInputProps {
  reviewText: string;
  setReviewText: (val: string) => void;
  isFocused: boolean;
  setIsFocused: (val: boolean) => void;
}

/**
 * RateReviewInput renders the review text input box with character counting.
 *
 * @param props.reviewText - Current text of the review.
 * @param props.setReviewText - Callback to change review text.
 * @param props.isFocused - Current focus state of the input.
 * @param props.setIsFocused - Callback to update focus state.
 */
export function RateReviewInput({
  reviewText,
  setReviewText,
  isFocused,
  setIsFocused,
}: RateReviewInputProps): React.JSX.Element {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>Your Review (Optional)</Text>
      <TextInput
        style={[styles.textInput, isFocused && styles.textInputFocused]}
        multiline
        placeholder="Share your experience to help other devotees..."
        placeholderTextColor={THEME.colors.textMuted}
        value={reviewText}
        onChangeText={setReviewText}
        maxLength={500}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, reviewText.length > 450 && styles.charCountWarn]}>
        {reviewText.length} / 500
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewSection: { marginTop: 24 },
  reviewSectionTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  textInput: {
    minHeight: 100,
    maxHeight: 200,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surface,
  },
  textInputFocused: { borderColor: THEME.colors.borderActive },
  charCount: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: THEME.colors.primary },
});
