import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import priestService from "../../../services/priestService";
import { useNotifications } from "../../../context/NotificationContext";
import ProfileCompletionBanner from "../../../components/ProfileCompletionBanner";
import { SkeletonCard } from "../../../components/SkeletonCard";

const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const { unreadCount, toggleNotifications, showNotifications } = useNotifications();

  const [loading, setLoading] = useState<boolean>(true);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({
    thisMonth: 0,
    growthPercentage: 0,
    availableBalance: 0,
  });
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        const priestId = userInfo?._id;
        if (!priestId) return;

        if (mounted) setLoading(true);

        try {
          const [bookingsRes, earningsRes, completionRes] = await Promise.allSettled([
            priestService.getBookings(priestId), // Fetch all to filter locally
            priestService.getEarnings(priestId),
            priestService.getProfileCompletion()
          ]);

          if (!mounted) return;

          if (bookingsRes.status === 'fulfilled') {
            const data = bookingsRes.value;
            const bookings = Array.isArray(data) ? data : data?.data || [];
            setAllBookings(bookings);
          }

          if (earningsRes.status === 'fulfilled') {
            const e = earningsRes.value;
            setEarnings(e?.data || e || { thisMonth: 0, growthPercentage: 0, availableBalance: 0 });
          }

          if (completionRes.status === 'fulfilled') {
            setProfileCompletion(completionRes.value);
          }

        } catch (err) {
          console.error(err);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [userInfo?._id])
  );

  const pendingRequests = useMemo(() => {
    return allBookings.filter(b => b.status === 'pending');
  }, [allBookings]);

  const upNextBooking = useMemo(() => {
    return allBookings
      .filter(b => b.status === 'confirmed' && new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [allBookings]);

  const handleAccept = async (bookingId: string) => {
    try {
      await priestService.updateBookingStatus(bookingId, 'confirmed');
      // Alert.alert("Success", "Booking accepted!");
      // Reload
      // fast refresh would be better but simple reload works
      // In a real app we'd update state locally.
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept");
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await priestService.updateBookingStatus(bookingId, 'cancelled');
      // Alert.alert("Success", "Booking rejected");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to reject");
    }
  };

  const openMaps = (location: any) => {
    if (!location) return;
    // Simple maps intent
    const query = location.coordinates ? `${location.coordinates[1]},${location.coordinates[0]}` : location.address;
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="light" backgroundColor={APP_COLORS.primary} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }} style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: 24 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.headerTitle}>{userInfo?.name || "Priest"}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationBell}
                onPress={toggleNotifications}
              >
                <Ionicons
                  name={showNotifications ? "notifications" : "notifications-outline"}
                  size={28}
                  color={APP_COLORS.white}
                />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        {!loading && profileCompletion && profileCompletion.completionPercentage < 100 && (
          <ProfileCompletionBanner data={profileCompletion} />
        )}

        {loading ? (
          <View style={{ padding: 20 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.content}>

            {/* 1. Dashboard Grid - Earnings Summary */}
            <View style={styles.dashboardGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>₹{earnings.thisMonth}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={styles.statValue}>₹{earnings.availableBalance}</Text>
              </View>
            </View>

            {/* 2. Up Next */}
            {upNextBooking && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Up Next</Text>
                <View style={styles.upNextCard}>
                  <View style={styles.upNextHeader}>
                    <Text style={styles.ceremonyTitle}>{upNextBooking.ceremonyType || upNextBooking.ceremony}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>CONFIRMED</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText}>{upNextBooking.devoteeId?.name || "Client"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText}>
                      {new Date(upNextBooking.date).toLocaleDateString()} • {upNextBooking.startTime || upNextBooking.time}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {upNextBooking.location?.address || "Location details"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openMaps(upNextBooking.location)}
                  >
                    <Ionicons name="navigate-outline" size={18} color={APP_COLORS.white} />
                    <Text style={styles.actionButtonText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3. Pending Requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {pendingRequests.map((req, index) => (
                    <View key={index} style={styles.requestCard}>
                      <Text style={styles.reqTitle}>{req.ceremonyType || req.ceremony}</Text>
                      <Text style={styles.reqClient}>{req.devoteeId?.name}</Text>
                      <Text style={styles.reqDate}>
                        {new Date(req.date).toLocaleDateString()}
                      </Text>

                      <View style={styles.reqActions}>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: APP_COLORS.error + '20' }]}
                          onPress={() => handleReject(req._id)}
                        >
                          <Text style={[styles.smallBtnText, { color: APP_COLORS.error }]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: APP_COLORS.success + '20' }]}
                          onPress={() => handleAccept(req._id)}
                        >
                          <Text style={[styles.smallBtnText, { color: APP_COLORS.success }]}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {!upNextBooking && pendingRequests.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={APP_COLORS.lightGray} />
                <Text style={styles.emptyStateText}>No upcoming activity</Text>
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  header: {
    backgroundColor: APP_COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerContent: {},
  welcomeText: {
    color: APP_COLORS.white,
    opacity: 0.8,
    fontSize: 14,
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notificationBell: {
    position: 'relative'
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.error,
    borderWidth: 1,
    borderColor: APP_COLORS.white,
  },
  content: {
    padding: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 12,
  },
  upNextCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: APP_COLORS.primary,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.primary,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ceremonyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    flex: 1,
  },
  badge: {
    backgroundColor: APP_COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: APP_COLORS.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  actionButton: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: APP_COLORS.white,
    width: 200,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    elevation: 2,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reqClient: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 2,
  },
  reqDate: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 12,
  },
  reqActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: APP_COLORS.gray,
    fontSize: 16,
  }
});

export default HomeScreen;
