import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { THEME } from '@/constants/theme';
import { usePriestProfile, usePriestReviews } from '@/hooks/usePriestDetails';
import { getStartingPrice } from '@/utils/priestDetailsUtils';
import PrimaryButton from '@/components/shared/PrimaryButton';
import { setBookingType, setPreferredPriest } from '@/redux/slices/bookingSlice';
import { ModeConflictHandler } from '@/components/devotee/booking/DateSection';

import { CollapsedHeader } from '@/components/devotee/priestDetails/CollapsedHeader';
import { HeroSection } from '@/components/devotee/priestDetails/HeroSection';
import { QuickInfoRow } from '@/components/devotee/priestDetails/QuickInfoRow';
import { AboutSection } from '@/components/devotee/priestDetails/AboutSection';
import { ServicesSection } from '@/components/devotee/priestDetails/ServicesSection';
import { RatingsSection } from '@/components/devotee/priestDetails/RatingsSection';
import { AvailabilitySection } from '@/components/devotee/priestDetails/AvailabilitySection';
import { BookingBar } from '@/components/devotee/priestDetails/BookingBar';

const HERO_HEIGHT = 340;

/**
 * PriestDetailsScreen - Main assembly screen for devotee to view priest profile.
 * Renders hero section, statistics, services list, ratings and reviews breakdown,
 * and upcoming availability slots.
 */
export default function PriestDetailsScreen() {
  const { id: priestProfileId, userId } = useLocalSearchParams<{
    id: string;
    userId?: string;
    ceremonyId?: string;
    ceremonyName?: string;
  }>();
  const router = useRouter();
  const dispatch = useDispatch();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data: priest, isLoading, error, refetch } = usePriestProfile(priestProfileId);
  const { data: reviewsData, isLoading: reviewsLoading } = usePriestReviews(priestProfileId);

  const collapsedHeaderOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleBookNow = () => {
    router.push({
      pathname: '/devotee/(screens)/BookCeremony' as any,
      params: {
        priestId: priestProfileId,
        priestUserId: userId || priest?.userId || '',
      }
    });
  };
  
  const handleBookService = (serviceId: string, ceremonyName: string) => {
    // Track which service was tapped for use in handleModeConflict
    const svc = (priest?.services as any[])?.find(
      (s: any) => s._id === serviceId || s.ceremonyId?._id === serviceId || s.ceremonyId === serviceId
    );
    setSelectedServiceId(serviceId);
    setSelectedCeremonyId(
      (svc?.ceremonyId as any)?._id ?? svc?.ceremonyId ?? serviceId
    );

    router.push({
      pathname: '/devotee/(screens)/BookCeremony' as any,
      params: {
        priestId: priestProfileId,
        priestUserId: userId || priest?.userId || '',
        serviceId,
        ceremonyName,
      }
    });
  };

  /**
   * Called by DateSection when a date conflicts with the current booking mode.
   * 'use_instant': user selected an instant-window date while in scheduled mode.
   * We offer to broadcast with this priest getting a 3-minute head-start.
   */
  const handleModeConflict: ModeConflictHandler = (type) => {
    if (type === 'use_instant') {
      const priestUserId = userId || (priest as any)?.userId?._id || priest?.userId || '';
      Alert.alert(
        'Switching to Instant Booking',
        'We will broadcast your request to all available pandits. ' +
        'We will try to notify this pandit first, but cannot ' +
        'guarantee they will be the one who accepts.\n\n' +
        'Continue with instant booking?',
        [
          {
            text: 'Yes, Book Instantly',
            onPress: () => {
              dispatch(setBookingType('instant'));
              dispatch(setPreferredPriest(priestUserId));
              router.push({
                pathname: '/devotee/(screens)/InstantBookingSetup' as any,
                params: {
                  ceremonyId: selectedCeremonyId ?? '',
                  preferredPriestId: priestUserId,
                },
              });
            },
          },
          { text: 'Choose a Different Date' },
        ]
      );
    }
  };

  const handleViewAllReviews = () => {
    Alert.alert('Coming Soon', 'Full review list will be available soon.');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonHero, { height: HERO_HEIGHT }]} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
      </View>
    );
  }

  if (error || !priest) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={THEME.colors.textMuted} />
        <Text style={styles.errorHeading}>Couldn't load this profile</Text>
        <Text style={styles.errorText}>{error?.message ?? 'Profile not found'}</Text>
        <PrimaryButton variant="outline" title="Try Again" onPress={refetch} style={styles.errorButton} />
        <PrimaryButton variant="ghost" title="Go Back" onPress={() => router.back()} style={{ width: 200 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CollapsedHeader name={priest.name} opacity={collapsedHeaderOpacity} />
      
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection priest={priest} />
        <QuickInfoRow languages={priest.languages} religiousTradition={priest.religiousTradition} />
        <AboutSection bio={priest.description} specializations={priest.specializations} />
        
        <View style={styles.servicesWrapper}>
          <ServicesSection services={priest.services} priestProfileId={priestProfileId} onBookService={handleBookService} />
        </View>
        
        <RatingsSection ratings={priest.ratings} reviews={reviewsData?.reviews ?? []} isLoading={reviewsLoading} onViewAll={handleViewAllReviews} />
        <AvailabilitySection weeklySchedule={priest.availability?.weeklySchedule} priestProfileId={priestProfileId} />
      </Animated.ScrollView>

      <BookingBar startingPrice={getStartingPrice(priest.services)} priestProfileId={priestProfileId} onBookNow={handleBookNow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  skeletonHero: { width: '100%', backgroundColor: THEME.colors.border, opacity: 0.5 },
  skeletonLine: { height: 20, margin: 16, backgroundColor: THEME.colors.border, opacity: 0.5, borderRadius: 4 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7', padding: 24 },
  errorHeading: { fontSize: 20, fontWeight: '700', color: THEME.colors.textPrimary, marginTop: 16, textAlign: 'center' },
  errorText: { fontSize: 15, color: THEME.colors.textSecondary, textAlign: 'center', marginTop: 8 },
  errorButton: { marginTop: 24, marginBottom: 8, width: 200 },
  servicesWrapper: { backgroundColor: '#FFFAF5', paddingVertical: 16 },
});
