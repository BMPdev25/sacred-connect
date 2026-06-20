import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { THEME } from '@/constants/theme';
import { PriestReview } from '@/types/priestDetails.types';
import { StarDisplay } from '@/components/shared/StarDisplay';
import { calculateRatingBreakdown, formatReviewDate } from '@/utils/priestDetailsUtils';
import { normalizeProfilePicture } from '@/utils/imageUtils';

/** Component props for RatingBar */
interface RatingBarProps {
  stars: number;
  percentage: number;
}

/** Renders a single horizontal bar in the rating breakdown */
function RatingBar({ stars, percentage }: RatingBarProps) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barStars}>{stars}★</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.barPercentage}>{percentage}%</Text>
    </View>
  );
}

/** Component props for ReviewCard */
interface ReviewCardProps {
  review: PriestReview;
  showDivider: boolean;
}

/** Renders an individual review card with avatar, rating, and text */
function ReviewCard({ review, showDivider }: ReviewCardProps) {
  const reviewerPicUrl = normalizeProfilePicture(review.userId?.profilePicture);
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {reviewerPicUrl ? (
          <Image source={{ uri: reviewerPicUrl }} style={styles.reviewAvatar} />
        ) : (
          <View style={styles.reviewAvatarFallback}>
            <Text style={styles.reviewAvatarText}>
              {review.userId?.name ? review.userId.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.reviewCenter}>
          <Text style={styles.reviewerName}>{review.userId?.name || 'Unknown User'}</Text>
          <StarDisplay rating={review.rating} size={12} />
        </View>
        <Text style={styles.reviewDate}>{formatReviewDate(review.timestamp)}</Text>
      </View>
      
      {review.review ? (
        <Text style={styles.reviewText}>{review.review}</Text>
      ) : (
        <Text style={styles.noReviewText}>No written review</Text>
      )}
      
      <Text style={styles.ceremonyContext}>{review.ceremonyType}</Text>
      {showDivider && <View style={styles.reviewDivider} />}
    </View>
  );
}

/** Renders placeholder skeleton while reviews are loading */
function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <View style={[styles.shimmer, { height: 80, marginBottom: THEME.spacing.xl }]} />
      <View style={[styles.shimmer, { height: 100, marginBottom: THEME.spacing.md }]} />
      <View style={[styles.shimmer, { height: 100, marginBottom: THEME.spacing.md }]} />
      <View style={[styles.shimmer, { height: 100 }]} />
    </View>
  );
}

export interface RatingsSectionProps {
  /** Aggregate ratings object */
  ratings: { average: number; count: number };
  /** Array of reviews to display */
  reviews: PriestReview[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Callback triggered when viewing all reviews */
  onViewAll: () => void;
}

/** Main section component displaying rating breakdown and recent reviews */
export function RatingsSection({ ratings, reviews, isLoading, onViewAll }: RatingsSectionProps) {
  let breakdown = calculateRatingBreakdown(reviews, ratings);
  
  if (reviews.length === 0) {
    const rounded = Math.round(ratings.average || 0);
    breakdown = ([5, 4, 3, 2, 1] as const).map(stars => ({
      stars,
      count: stars === rounded ? ratings.count : 0,
      percentage: stars === rounded && ratings.count > 0 ? 100 : 0
    }));
  }

  const handleViewAll = () => {
    Alert.alert('Coming soon', 'Full reviews list will be available soon.');
    onViewAll();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subheading}>Ratings & Reviews</Text>
      
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.ratingNumber}>
                {ratings.average > 0 ? ratings.average.toFixed(1) : '0.0'}
              </Text>
              <StarDisplay rating={ratings.average} size={14} />
              <Text style={styles.reviewCountText}>{ratings.count} reviews</Text>
            </View>
            <View style={styles.summaryRight}>
              {breakdown.map((item) => (
                <RatingBar key={item.stars} stars={item.stars} percentage={item.percentage} />
              ))}
            </View>
          </View>
          
          <View style={styles.reviewsList}>
            {reviews.slice(0, 3).map((review, index) => (
              <ReviewCard 
                key={review._id} 
                review={review} 
                showDivider={index < Math.min(reviews.length, 3) - 1} 
              />
            ))}
            
            {reviews.length === 0 && (
              <Text style={styles.emptyText}>No reviews yet</Text>
            )}
            
            {ratings.count > 3 && (
              <Pressable onPress={handleViewAll}>
                <Text style={styles.viewAllText}>View all {ratings.count} reviews →</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: THEME.spacing.md,
  },
  subheading: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  summaryLeft: {
    width: 100,
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: THEME.colors.gold,
  },
  reviewCountText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  summaryRight: {
    flex: 1,
    paddingLeft: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barStars: {
    width: 28,
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  barPercentage: {
    width: 32,
    textAlign: 'right',
    fontSize: THEME.typography.caption,
    color: THEME.colors.textSecondary,
  },
  loadingContainer: {
    width: '100%',
  },
  shimmer: {
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
    opacity: 0.5,
  },
  reviewsList: {
    marginTop: THEME.spacing.sm,
  },
  reviewCard: {
    paddingVertical: THEME.spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewCenter: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  reviewerName: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
  },
  reviewText: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  noReviewText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  ceremonyContext: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginTop: 12,
  },
  emptyText: {
    fontSize: THEME.typography.caption,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginVertical: THEME.spacing.lg,
  },
  viewAllText: {
    color: THEME.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: THEME.spacing.lg,
  },
});
