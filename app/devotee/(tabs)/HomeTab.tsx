/**
 * HomeTab — main devotee home screen.
 *
 * Sections:
 *  - Time-based greeting header with city name / location CTA
 *  - Banner carousel (auto-scroll, colour fallback)
 *  - Ceremony category chips (horizontal, tap → ExploreTab)
 *  - Nearby pandits (horizontal cards, locked when location denied)
 *  - Upcoming festivals (date-block rows)
 *
 * Shows skeleton on first load; supports pull-to-refresh.
 */

import React, { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';
import { useBanners, useCategories, useNearbyPriests, useUpcomingFestivals } from '@/hooks/useHomeData';
import { useUserLocation } from '@/hooks/useUserLocation';
import HomeSkeleton from '@/components/devotee/home/HomeSkeleton';
import HomeBannerCarousel from '@/components/devotee/home/HomeBannerCarousel';
import CategoryChips from '@/components/devotee/home/CategoryChips';
import NearbyPriestsSection from '@/components/devotee/home/NearbyPriestsSection';
import FestivalRow from '@/components/devotee/home/FestivalRow';
import { THEME } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helper — greeting text
// ---------------------------------------------------------------------------

/**
 * Returns a time-appropriate greeting string.
 * 0-11 → Good morning, 12-16 → Good afternoon,
 * 17-20 → Good evening, 21-23 → Good night.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
}

/** Styled section header label. */
function SectionHeader({ title }: SectionHeaderProps): React.JSX.Element {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface HomeHeaderProps {
  userName: string;
  cityName: string | null;
  permissionStatus: string;
  onRequestLocation: () => void;
}

/**
 * Top greeting block with username and location row.
 */
function HomeHeader({
  userName,
  cityName,
  permissionStatus,
  onRequestLocation,
}: HomeHeaderProps): React.JSX.Element {
  const firstName = userName.split(' ')[0] || 'Devotee';

  return (
    <View style={styles.headerBlock}>
      <Text style={styles.greeting}>{getGreeting()},</Text>
      <Text style={styles.userName} numberOfLines={1}>{firstName} 🙏</Text>

      {permissionStatus === 'granted' && cityName ? (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={THEME.colors.primary} />
          <Text style={styles.locationText}>{cityName}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.locationRow}
          onPress={onRequestLocation}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Set your location"
        >
          <Ionicons name="location-outline" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.locationCta}>Set location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

/**
 * HomeTab screen for the Devotee section.
 * Fetches all home data via React Query, shows skeleton during first load.
 */
export default function HomeTab(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const userName = useSelector((state: RootState) => state.user.name);
  const { coordinates, cityName, permissionStatus, isLoading: locationLoading, requestLocation } =
    useUserLocation();

  const lat = coordinates?.latitude ?? null;
  const lng = coordinates?.longitude ?? null;
  const locationGranted = permissionStatus === 'granted';

  const bannersQuery = useBanners();
  const categoriesQuery = useCategories();
  const priestsQuery = useNearbyPriests(lat, lng);
  const festivalsQuery = useUpcomingFestivals();

  // Include priests query in first-load detection only when the query is active (location granted)
  const coreQueriesPending =
    bannersQuery.isPending &&
    categoriesQuery.isPending &&
    festivalsQuery.isPending;

  const priestsPending = locationGranted && priestsQuery.isPending;
  const isFirstLoad = coreQueriesPending || priestsPending;

  const isRefreshing =
    bannersQuery.isFetching ||
    categoriesQuery.isFetching ||
    festivalsQuery.isFetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['banners'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['nearbyPriests'] });
    queryClient.invalidateQueries({ queryKey: ['upcomingFestivals'] });
  }, [queryClient]);

  const banners = bannersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const priests = priestsQuery.data ?? [];
  const festivals = festivalsQuery.data ?? [];

  if (isFirstLoad || locationLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[THEME.colors.primary]}
            tintColor={THEME.colors.primary}
          />
        }
      >
        <HomeHeader
          userName={userName}
          cityName={cityName}
          permissionStatus={permissionStatus}
          onRequestLocation={requestLocation}
        />

        <HomeBannerCarousel banners={banners} />

        <SectionHeader title="Browse Ceremonies" />
        <CategoryChips categories={categories} />

        <SectionHeader title="Pandits Near You" />
        <NearbyPriestsSection
          priests={priests}
          locationGranted={locationGranted}
          locationLoading={locationLoading}
          onRequestLocation={requestLocation}
        />

        {festivals.length > 0 ? (
          <View style={styles.festivalsSection}>
            <SectionHeader title="Upcoming Festivals" />
            <View style={styles.festivalCard}>
              {festivals.map((festival, index) => (
                <FestivalRow
                  key={festival.id}
                  festival={festival}
                  isLast={index === festivals.length - 1}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
  },
  headerBlock: {
    marginBottom: THEME.spacing.md,
  },
  greeting: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    fontWeight: '400',
  },
  userName: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
    marginBottom: THEME.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  locationCta: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  festivalsSection: {
    marginTop: THEME.spacing.xs,
  },
  festivalCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
    ...THEME.shadow.card,
  },
  bottomPad: {
    height: THEME.spacing.xl,
  },
});
