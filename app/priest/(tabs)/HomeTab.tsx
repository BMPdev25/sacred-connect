import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { THEME } from '@/constants/theme';
import Logo from '@/components/shared/Logo';
import { RootState } from '@/redux/store';
import {
  setCurrentStatus,
  setIsTogglingStatus,
  setTodayBookings,
  setStats,
  incrementPendingRequests,
} from '@/redux/slices/priestDashboardSlice';
import { PriestDashboardService } from '@/services/priest/priestDashboardService';
import { SocketManager } from '@/services/priest/socketManager';
import { TodayBooking, PriestOnlineStatus } from '@/types/priest.dashboard.types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToggleSwitch({ isOn, disabled }: { isOn: boolean; disabled: boolean }) {
  const translateX = useRef(new Animated.Value(isOn ? 28 : 4)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOn ? 28 : 4,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOn]);

  return (
    <View style={[
      styles.switchContainer,
      { backgroundColor: isOn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }
    ]}>
      <Animated.View style={[
        styles.switchThumb,
        { transform: [{ translateX }] }
      ]}>
        {disabled && <ActivityIndicator size="small" color={THEME.colors.primary} />}
      </Animated.View>
    </View>
  );
}

function OnlineToggleBanner({
  status,
  isToggling,
  onToggle,
}: {
  status: PriestOnlineStatus;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const isOnline = status === 'available';
  const fadeAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={styles.bannerContainer}
      disabled={isToggling}
    >
      {/* Offline Gradient (Base) */}
      <LinearGradient
        colors={['#6B7280', '#374151']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Online Gradient (Overlay animated) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#FF9933', '#800000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.bannerContentRow}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerHeading}>
            {isOnline ? 'You are Online' : 'You are Offline'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {isOnline ? 'Accepting new booking requests' : 'Go online to receive bookings'}
          </Text>
          {isOnline && (
            <View style={styles.activeIndicatorRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeCaption}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.bannerRight}>
          {isToggling ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ToggleSwitch isOn={isOnline} disabled={isToggling} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TodayBookingCard({ booking, onPress }: { booking: TodayBooking; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.bookingCardTop}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{`${booking.startTime} - ${booking.endTime}`}</Text>
        </View>
        <Ionicons name="calendar" size={16} color={THEME.colors.primary} />
      </View>
      <Text style={styles.ceremonyName} numberOfLines={1}>{booking.ceremonyType}</Text>
      <Text style={styles.devoteeName} numberOfLines={1}>{booking.devoteeId?.name || 'Devotee'}</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>Confirmed</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ iconName, value, label }: { iconName: any; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={iconName} size={22} color={THEME.colors.primary} style={{ marginBottom: 6 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HomeTab(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { currentStatus, isTogglingStatus, todayBookings, stats, pendingRequestsCount } = useSelector(
    (state: RootState) => state.priestDashboard
  );
  const priest = useSelector((state: RootState) => (state as any).user?.user);

  useEffect(() => {
    PriestDashboardService.fetchPriestStatus().then((status) => {
      dispatch(setCurrentStatus(status));
    });
  }, [dispatch]);

  useEffect(() => {
    PriestDashboardService.fetchTodayBookings().then((bookings) => {
      dispatch(setTodayBookings(bookings));
    });
  }, [dispatch]);

  useEffect(() => {
    PriestDashboardService.fetchDashboardStats().then((data) => {
      dispatch(setStats(data));
    });
  }, [dispatch]);

  useEffect(() => {
    if (priest?._id && !SocketManager.isConnected()) {
      SocketManager.connectSocket(priest._id);
    }

    const handleNewRequest = () => {
      PriestDashboardService.fetchDashboardStats().then(data => dispatch(setStats(data)));
      dispatch(incrementPendingRequests());
    };

    SocketManager.onNewBookingRequest(handleNewRequest);

    return () => {
      SocketManager.offNewBookingRequest(handleNewRequest);
    };
  }, [dispatch, priest]);

  const handleToggle = async () => {
    if (isTogglingStatus) return;
    dispatch(setIsTogglingStatus(true));
    const isOnline = currentStatus === 'available';
    const targetStatus = isOnline ? 'offline' : 'available';
    
    try {
      const newStatus = await PriestDashboardService.toggleOnlineStatus(targetStatus);
      dispatch(setCurrentStatus(newStatus));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      dispatch(setIsTogglingStatus(false));
    }
  };

  const handleNotificationPress = () => {
    router.push('/(priest)/screens/NotificationCenter' as any);
  };

  const handleBookingPress = (bookingId: string) => {
    router.push({
      pathname: '/(priest)/screens/BookingDetails',
      params: { bookingId },
    } as any);
  };

  const navigateToRequests = () => {
    router.push('/priest/(tabs)/RequestsTab' as any);
  };

  return (
    <View style={styles.container}>
      {/* HEADER ROW */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Logo variant="icon-only" size="sm" />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={handleNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color={THEME.colors.textPrimary} />
          {pendingRequestsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ONLINE/OFFLINE TOGGLE BANNER */}
        <OnlineToggleBanner
          status={currentStatus}
          isToggling={isTogglingStatus}
          onToggle={handleToggle}
        />

        {/* PENDING REQUESTS BANNER */}
        {pendingRequestsCount > 0 && (
          <TouchableOpacity style={styles.pendingBanner} onPress={navigateToRequests}>
            <Ionicons name="flash" size={20} color={THEME.colors.primary} style={{ marginRight: THEME.spacing.sm }} />
            <Text style={styles.pendingBannerText}>
              {pendingRequestsCount} new booking request{pendingRequestsCount > 1 ? 's' : ''} waiting
            </Text>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* TODAY'S SCHEDULE SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todayBookings.length === 0 ? (
            <Text style={styles.emptyText}>No ceremonies scheduled for today</Text>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={todayBookings}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16, marginTop: THEME.spacing.md }}
              renderItem={({ item }) => (
                <TodayBookingCard booking={item} onPress={() => handleBookingPress(item._id)} />
              )}
            />
          )}
        </View>

        {/* QUICK STATS ROW */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { marginBottom: THEME.spacing.md }]}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <StatCard
              iconName="calendar-outline"
              value={`₹${(stats?.thisMonth || 0).toLocaleString('en-IN')}`}
              label="THIS MONTH"
            />
            <StatCard
              iconName="document-text-outline"
              value={(stats?.totalBookings || 0).toString()}
              label="TOTAL BOOKINGS"
            />
            <StatCard
              iconName="star-outline"
              value={(stats?.rating || 0).toFixed(1)}
              label="RATING"
            />
            <StatCard
              iconName="wallet-outline"
              value={`₹${(stats?.pendingPayout || 0).toLocaleString('en-IN')}`}
              label="PENDING PAYOUT"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#800000',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Toggle Switch
  switchContainer: {
    width: 56,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Toggle Banner
  bannerContainer: {
    height: 110,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  bannerContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 1,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 13,
    marginTop: 4,
  },
  activeIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  activeCaption: {
    color: '#22C55E',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 60,
  },

  // Pending Banner
  pendingBanner: {
    marginHorizontal: 16,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBannerText: {
    flex: 1,
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: '#D97706',
  },

  // Sections
  sectionContainer: {
    marginTop: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
    paddingHorizontal: 16,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
    width: 180,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
  },
  timeBadgeText: {
    fontSize: THEME.typography.caption,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  ceremonyName: {
    fontSize: THEME.typography.body,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  devoteeName: {
    fontSize: THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: THEME.typography.caption,
    fontWeight: '600',
    color: '#166534',
  },

  // Stat Card
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: THEME.typography.subheading,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
