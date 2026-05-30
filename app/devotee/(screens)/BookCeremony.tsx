import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '@/redux/store';
import { initBookingFlow, setSelectedService, updatePriestDisplayInfo } from '@/redux/slices/bookingSlice';
import { usePriestProfile } from '@/hooks/usePriestDetails';
import { THEME } from '@/constants/theme';
import { StepIndicator } from '@/components/devotee/booking/StepIndicator';

import { PriestMiniCard } from '@/components/devotee/booking/PriestMiniCard';
import { ServiceSection } from '@/components/devotee/booking/ServiceSection';
import { DateSection } from '@/components/devotee/booking/DateSection';
import { TimeSection } from '@/components/devotee/booking/TimeSection';
import { AddressSection } from '@/components/devotee/booking/AddressSection';
import { BookingBottomBar, isBookingComplete } from '@/components/devotee/booking/BookingBottomBar';

const useSectionOffsets = () => {
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  
  const onLayoutSection = (section: string) => (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setOffsets((prev) => ({ ...prev, [section]: layout.y }));
  };
  
  return { offsets, onLayoutSection };
};

export default function BookCeremonyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    priestId: string;
    priestUserId: string;
    serviceId?: string;
    ceremonyName?: string;
  }>();

  const dispatch = useDispatch();
  const draft = useSelector((state: RootState) => state.booking);
  const scrollRef = useRef<ScrollView>(null);
  
  const { data: cachedPriestData } = usePriestProfile(params.priestId || '');
  const { offsets, onLayoutSection } = useSectionOffsets();

  // Scroll automatically when active section changes
  useEffect(() => {
    const targetY = offsets[draft.activeSection];
    if (targetY !== undefined) {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  }, [draft.activeSection, offsets]);

  const handleReviewPress = async () => {
    if (isBookingComplete(draft)) {
      router.push('/devotee/(screens)/BookingSummary' as any);
    }
  };

  // Effect 1: Runs ONCE on mount only (empty dependency array).
  // Sets priest identifiers. Never resets selections.
  useEffect(() => {
    dispatch(
      initBookingFlow({
        priestProfileId: params.priestId || '',
        priestUserId: params.priestUserId || '',
      })
    );

    // Pre-select service if passed as param
    if (params.serviceId && params.ceremonyName) {
      const selected = cachedPriestData?.services?.find(s => s._id === params.serviceId);
      dispatch(
        setSelectedService({
          serviceId: params.serviceId,
          ceremonyId: (selected?.ceremonyId as any)?._id || selected?.ceremonyId || params.serviceId,
          ceremonyName: params.ceremonyName,
          durationMinutes: selected?.durationMinutes || 60,
          basePrice: selected?.price || 1500,
        })
      );
    }
  }, []);

  // Effect 2: Runs when cachedPriestData resolves.
  // Only updates priest display info (name, photo, rating).
  // NEVER touches selections.
  useEffect(() => {
    if (!cachedPriestData) return;
    dispatch(
      updatePriestDisplayInfo({
        priestName: cachedPriestData.name,
        priestProfilePicture: cachedPriestData.profilePicture,
        priestRating: cachedPriestData.ratings?.average,
      })
    );
  }, [cachedPriestData]);

  const getStepStatus = (section: 'service' | 'date' | 'time' | 'address') => {
    switch (section) {
      case 'service':
        if (draft.selectedService) return 'completed';
        if (draft.activeSection === 'service') return 'active';
        return 'locked';
      case 'date':
        if (draft.selectedDate) return 'completed';
        if (draft.activeSection === 'date') return 'active';
        if (draft.selectedService) return 'active';
        return 'locked';
      case 'time':
        if (draft.selectedTimeSlot) return 'completed';
        if (draft.activeSection === 'time') return 'active';
        if (draft.selectedDate) return 'active';
        return 'locked';
      case 'address':
        if (draft.selectedAddress) return 'completed';
        if (draft.activeSection === 'address') return 'active';
        if (draft.selectedTimeSlot) return 'active';
        return 'locked';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Ceremony</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <PriestMiniCard priestProfileId={params.priestId || ''} />

        <View style={styles.stepperContainer}>
          <StepIndicator
            steps={[
              { key: 'service', status: getStepStatus('service') },
              { key: 'date', status: getStepStatus('date') },
              { key: 'time', status: getStepStatus('time') },
              { key: 'address', status: getStepStatus('address') },
            ]}
          />
          <View style={styles.stepContentContainer}>
            <View onLayout={onLayoutSection('service')}>
              <ServiceSection priestProfileId={params.priestId || ''} />
            </View>
            <View onLayout={onLayoutSection('date')}>
              <DateSection 
                weeklySchedule={cachedPriestData?.availability?.weeklySchedule}
                dateOverrides={(cachedPriestData?.availability as any)?.dateOverrides}
              />
            </View>
            <View onLayout={onLayoutSection('time')}>
              <TimeSection weeklySchedule={cachedPriestData?.availability?.weeklySchedule} />
            </View>
            <View onLayout={onLayoutSection('address')}>
              <AddressSection />
            </View>
          </View>
        </View>
      </ScrollView>

      <BookingBottomBar
        pricing={draft.pricing}
        isAllComplete={isBookingComplete(draft)}
        isLoading={false}
        onReviewPress={handleReviewPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: THEME.spacing.md, paddingVertical: THEME.spacing.sm, backgroundColor: THEME.colors.surface, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  backButton: { padding: 4 },
  headerTitle: { fontSize: THEME.typography.subheading, fontWeight: '600', color: THEME.colors.textPrimary },
  headerRightPlaceholder: { width: 32 },
  scrollContent: { paddingBottom: 100 },
  stepperContainer: { flexDirection: 'row', paddingLeft: 48, paddingRight: THEME.spacing.md, position: 'relative' },
  stepContentContainer: { flex: 1, paddingLeft: 8 },
});
