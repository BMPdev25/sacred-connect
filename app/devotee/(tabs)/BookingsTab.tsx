import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { THEME } from '@/constants/theme';
import { useUpcomingBookings, usePastBookings } from '@/hooks/useBookings';
import { BookingListItem } from '@/types/bookingManagement.types';

import { BookingCard } from '@/components/devotee/bookings/BookingCard';
import { BookingsEmptyState } from '@/components/devotee/bookings/BookingsEmptyState';
import { BookingCardSkeleton } from '@/components/devotee/bookings/BookingCardSkeleton';
import { TabSwitcher } from '@/components/devotee/bookings/TabSwitcher';

export default function BookingsTab(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  const {
    bookings: upcoming,
    isLoading: upcomingLoading,
    hasMore: upcomingHasMore,
    fetchNextPage: fetchMoreUpcoming,
    refetch: refetchUpcoming,
  } = useUpcomingBookings();

  const {
    bookings: past,
    isLoading: pastLoading,
    hasMore: pastHasMore,
    fetchNextPage: fetchMorePast,
    refetch: refetchPast,
  } = usePastBookings();

  const handleBookingPress = (bookingId: string) => {
    router.push({
      pathname: '/devotee/(screens)/BookingDetails' as any,
      params: { bookingId },
    });
  };

  const handleActionPress = (booking: BookingListItem) => {
    switch (booking.status) {
      case 'pending':
      case 'confirmed':
        handleBookingPress(booking._id);
        break;
      case 'completed':
        router.push({
          pathname: '/devotee/(screens)/RateReview' as any,
          params: { bookingId: booking._id },
        });
        break;
      case 'cancelled':
      case 'rejected':
        router.push({
          pathname: '/devotee/(screens)/PriestDetails' as any,
          params: { id: booking.priestId._id, userId: booking.priestId._id },
        });
        break;
    }
  };

  const handleBookNow = () => {
    router.push('/devotee/(tabs)/HomeTab' as any);
  };

  const currentData = activeTab === 'upcoming' ? upcoming : past;
  const currentLoading = activeTab === 'upcoming' ? upcomingLoading : pastLoading;
  const currentHasMore = activeTab === 'upcoming' ? upcomingHasMore : pastHasMore;
  const currentFetchNext = activeTab === 'upcoming' ? fetchMoreUpcoming : fetchMorePast;
  const currentRefetch = activeTab === 'upcoming' ? refetchUpcoming : refetchPast;

  const renderEmptyComponent = () => {
    if (currentLoading) {
      return (
        <>
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </>
      );
    }
    return <BookingsEmptyState tab={activeTab} onBookNow={handleBookNow} />;
  };

  const renderFooter = () => {
    if (currentHasMore && !currentLoading && currentData.length > 0) {
      return (
        <ActivityIndicator
          color={THEME.colors.primary}
          style={{ marginVertical: THEME.spacing.lg }}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TabSwitcher activeTab={activeTab} onSwitch={setActiveTab} />
      </View>

      {/* CONTENT LIST */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={handleBookingPress}
            onActionPress={handleActionPress}
          />
        )}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={currentFetchNext}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.listContent,
          currentData.length === 0 && !currentLoading ? styles.listContentEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false} // React Query handles internal refreshing visual, or we can leave it false as requested
            onRefresh={currentRefetch}
            tintColor={THEME.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: THEME.typography.displayMedium,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
});
