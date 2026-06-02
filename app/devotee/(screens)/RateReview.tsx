import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import { fetchBookingDetails } from '@/services/devotee/bookingManagementService';
import { submitRating, checkExistingRating } from '@/services/devotee/ratingService';
import { formatDisplayDate } from '@/utils/bookingUtils';
import { AssetService } from '@/services/assets/AssetService';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { RateContextCard } from '@/components/devotee/bookings/RateContextCard';
import { RateDetailsSection } from '@/components/devotee/bookings/RateDetailsSection';
import { RateOverallCard } from '@/components/devotee/bookings/RateOverallCard';
import { RateReviewInput } from '@/components/devotee/bookings/RateReviewInput';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RateReview() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [overallRating, setOverallRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [knowledge, setKnowledge] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const [isFocused, setIsFocused] = useState(false);

  const { data: booking, isLoading: isBookingLoading } = useQuery({
    queryKey: ['bookingDetail', bookingId],
    queryFn: () => fetchBookingDetails(bookingId!),
    staleTime: 30 * 1000,
    enabled: !!bookingId,
  });

  useEffect(() => {
    async function loadExisting() {
      if (!bookingId) {
        setIsChecking(false);
        return;
      }
      const existing = await checkExistingRating(bookingId);
      if (existing) {
        setExistingRatingId(existing._id);
        setOverallRating(existing.rating);
        if (existing.categories) {
          setPunctuality(existing.categories.punctuality || 5);
          setKnowledge(existing.categories.knowledge || 5);
          setBehavior(existing.categories.behavior || 5);
        }
        if (existing.review) {
          setReviewText(existing.review);
        }
      }
      setIsChecking(false);
    }
    loadExisting();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!booking || !bookingId) return;
    setIsSubmitting(true);
    try {
      await submitRating({
        bookingId,
        priestId: booking.priestId._id,
        rating: overallRating,
        categories: {
          punctuality,
          knowledge,
          behavior,
          overall: overallRating,
        },
        review: reviewText.trim() || undefined,
        ceremonyType: booking.ceremonyType,
        ceremonyDate: booking.date,
      });

      queryClient.invalidateQueries({ queryKey: ['pastBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingDetail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['priestProfile'] });
      queryClient.invalidateQueries({ queryKey: ['priestReviews'] });

      Alert.alert(
        'Thank you! 🙏',
        'Your review helps other devotees find the right pandit.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBookingLoading || isChecking || !booking) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const avatarPlaceholder = AssetService.getImage('shared.avatarPlaceholder');

  return (
    <View style={styles.safeArea}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>
          {existingRatingId ? 'Edit Your Review' : 'Rate Your Experience'}
        </Text>
        
        {/* Booking Context */}
        <RateContextCard
          priestName={booking.priestId.name}
          profilePicture={booking.priestId.profilePicture}
          avatarPlaceholder={avatarPlaceholder}
          ceremonyType={booking.ceremonyType}
          displayDate={formatDisplayDate(booking.date)}
        />

        {/* Overall Experience */}
        <RateOverallCard
          overallRating={overallRating}
          setOverallRating={setOverallRating}
        />

        {/* Rate the Details */}
        <RateDetailsSection
          punctuality={punctuality}
          setPunctuality={setPunctuality}
          knowledge={knowledge}
          setKnowledge={setKnowledge}
          behavior={behavior}
          setBehavior={setBehavior}
        />

        {/* Your Review (Text Input) */}
        <RateReviewInput
          reviewText={reviewText}
          setReviewText={setReviewText}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
        />

        {/* Submit Button */}
        <View style={styles.submitWrapper}>
          <PrimaryButton
            title={existingRatingId ? 'Update Review' : 'Submit Review'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={overallRating === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.colors.background, position: 'relative' },
  backBtn: { position: 'absolute', left: 16, zIndex: 10, padding: 8 },
  screenTitle: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.textPrimary, marginBottom: THEME.spacing.md },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  submitWrapper: { marginTop: 32, marginBottom: 16 },
});
