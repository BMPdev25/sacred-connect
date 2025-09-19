// src/screens/devotee/RatingScreen.js - Fixed Complete Code
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { APP_COLORS } from '../../constants/Colors';
import { submitRating } from '../../redux/slices/bookingSlice';
import { AppDispatch, RootState } from '../../redux/store';
import { formatDate } from '../../utils/dateUtils';

import { StatusBar } from 'react-native';
const HEADER_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

type Booking = {
  id?: string;
  priest?: { id?: string; name?: string; image?: any; specialization?: string };
  ceremony?: { type?: string; name?: string };
  date?: string;
  time?: string;
  status?: string;
  amount?: number;
};

type Categories = {
  punctuality: number;
  knowledge: number;
  behavior: number;
  overall: number;
};

const RatingScreen: React.FC<{ navigation: any; route: { params?: { booking?: Booking } } }> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.booking);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [categories, setCategories] = useState<Categories>({
    punctuality: 0,
    knowledge: 0,
    behavior: 0,
    overall: 0,
  });

  useEffect(() => {
    const bookingData = route.params?.booking || {
      id: 'BK001',
      priest: {
        id: 'P001',
        name: 'Pandit Ram Sharma',
  image: require('../../assets/images/pandit1.jpg'),
        specialization: 'Wedding Ceremonies',
      },
      ceremony: {
        type: 'Wedding Ceremony',
        name: 'Hindu Wedding',
      },
      date: '2024-02-15',
      time: '10:00 AM',
      status: 'completed',
      amount: 15000,
    };

    setBooking(bookingData);
  }, [route.params]);

  const ratingCategories: { key: keyof Categories; label: string; description: string; icon: string }[] = [
    {
      key: 'punctuality',
      label: 'Punctuality',
      description: 'Arrived on time',
      icon: 'time',
    },
    {
      key: 'knowledge',
      label: 'Religious Knowledge',
      description: 'Performed rituals correctly',
      icon: 'book',
    },
    {
      key: 'behavior',
      label: 'Behavior',
      description: 'Professional and respectful',
      icon: 'people',
    },
    {
      key: 'overall',
      label: 'Overall Experience',
      description: 'Would recommend to others',
      icon: 'star',
    },
  ];

  const handleStarPress = (categoryKey: string, starIndex: number) => {
    if (categoryKey === 'main') {
      setRating(starIndex + 1);
    } else {
      setCategories(prev => ({
        ...prev,
        [categoryKey as keyof Categories]: starIndex + 1,
      }));
    }
  };

  const renderStars = (currentRating: number, categoryKey = 'main', size = 30) => {
    return (
      <View style={styles.starsContainer}>
        {[0, 1, 2, 3, 4].map((starIndex) => (
          <TouchableOpacity
            key={starIndex}
            onPress={() => handleStarPress(categoryKey, starIndex)}
            style={styles.starButton}
          >
            <Ionicons
              name={(starIndex < currentRating ? 'star' : 'star-outline') as any}
              size={size}
              color={starIndex < currentRating ? '#FFD700' : APP_COLORS.lightGray}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating before submitting.');
      return;
    }

    if (categories.punctuality === 0 || categories.knowledge === 0 || categories.behavior === 0 || categories.overall === 0) {
      Alert.alert('Complete Rating', 'Please rate all categories before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const ratingData = {
        bookingId: booking?.id,
        priestId: booking?.priest?.id,
        rating: rating,
        categories: categories,
        review: review.trim(),
        ceremonyType: booking?.ceremony?.type,
        ceremonyDate: booking?.date,
        timestamp: new Date().toISOString(),
      };

      // Dispatch rating submission action
  const result = await dispatch(submitRating(ratingData) as any).unwrap();

  if ((result as any).success) {
        Alert.alert(
          'Thank You!',
          'Your rating and review have been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to bookings
                navigation.navigate('DevoteeTabs', { screen: 'Bookings' });
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Failed', (result as any).message || 'Please try again');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageRating = () => {
    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
    return total / Object.keys(categories).length;
  };

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
  <ExpoStatusBar style="light" backgroundColor={APP_COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: HEADER_TOP_PADDING, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4, borderBottomWidth: 1, borderBottomColor: APP_COLORS.lightGray }]}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.bookingSummary}>
          <View style={styles.summaryCard}>
            <View style={styles.priestInfo}>
              <Image source={booking.priest?.image || require('../../assets/images/pandit1.jpg')} style={styles.priestImage} />
              <View style={styles.priestDetails}>
                <Text style={styles.priestName}>{booking.priest?.name || 'Priest'}</Text>
                <Text style={styles.specialization}>{booking.priest?.specialization || ''}</Text>
                <Text style={styles.ceremonyDetails}>
                  {booking.ceremony?.name || ''} • {formatDate(booking.date || '')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating</Text>
          <View style={styles.overallRatingCard}>
            <Text style={styles.ratingPrompt}>How was your overall experience?</Text>
            {renderStars(rating, 'main', 40)}
            <Text style={styles.ratingText}>
              {rating === 0 ? 'Tap to rate' : rating + ' out of 5 stars'}
            </Text>
          </View>
        </View>

        {/* Category Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Different Aspects</Text>
          {ratingCategories.map((category) => (
            <View key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <Ionicons name={category.icon as any} size={20} color={APP_COLORS.primary} />
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                </View>
                <Text style={styles.categoryRating}>
                  {categories[category.key as keyof Categories]}/5
                </Text>
              </View>
              {renderStars(categories[category.key as keyof Categories], category.key, 25)}
            </View>
          ))}
        </View>

        {/* Written Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a Review (Optional)</Text>
          <View style={styles.reviewCard}>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your detailed experience with other devotees..."
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{review.length}/500</Text>
          </View>
        </View>

        {/* Rating Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Summary</Text>
          <View style={styles.summaryRatingCard}>
            <View style={styles.averageRating}>
              <Text style={styles.averageRatingNumber}>
                {getAverageRating().toFixed(1)}
              </Text>
              <Text style={styles.averageRatingLabel}>Average Rating</Text>
              {renderStars(Math.round(getAverageRating()), 'summary', 20)}
            </View>

            <View style={styles.ratingSummaryList}>
              {ratingCategories.map((category) => (
                <View key={category.key} style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>{category.label}:</Text>
                  <View style={styles.summaryItemRating}>
                    {renderStars(categories[category.key as keyof Categories], `summary_${category.key}`, 16)}

                    <Text style={styles.summaryItemScore}>({categories[category.key]}/5)</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="information-circle" size={20} color={APP_COLORS.info} />
          <Text style={styles.tipsText}>
            Your honest feedback helps other devotees make informed decisions and helps priests improve their services.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, (submitting || isLoading) && styles.disabledButton]}
          onPress={handleSubmitRating}
          disabled={submitting || isLoading}
        >
          {submitting || isLoading ? (
            <ActivityIndicator size="small" color={APP_COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={APP_COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Rating & Review</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    // Remove fixed paddingTop, use dynamic
  },
  backIcon: {
    padding: 5,
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookingSummary: {
    marginBottom: 25,
  },
  summaryCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priestImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  priestDetails: {
    flex: 1,
  },
  priestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 5,
  },
  specialization: {
    fontSize: 14,
    color: APP_COLORS.primary,
    marginBottom: 3,
  },
  ceremonyDetails: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 15,
  },
  overallRatingCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingPrompt: {
    fontSize: 16,
    color: APP_COLORS.black,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginTop: 10,
  },
  categoryCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    marginLeft: 10,
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.black,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  categoryRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  reviewCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewInput: {
    fontSize: 16,
    color: APP_COLORS.black,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: APP_COLORS.gray,
    textAlign: 'right',
    marginTop: 10,
  },
  summaryRatingCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageRating: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  averageRatingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 5,
  },
  averageRatingLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 10,
  },
  ratingSummaryList: {
    gap: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
    flex: 1,
  },
  summaryItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItemScore: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsText: {
    fontSize: 13,
    color: APP_COLORS.info,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
  submitButtonContainer: {
    padding: 20,
    backgroundColor: APP_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  submitButton: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default RatingScreen;