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
  Platform,
  RefreshControl
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSelector, useDispatch } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState, AppDispatch } from "../../../redux/store";
import { getEarnings } from "../../../redux/slices/priestSlice";
import priestService from "../../../services/priestService";
import { useNotifications } from "../../../context/NotificationContext";
import ProfileCompletionBanner from "../../../components/ProfileCompletionBanner";
import { SkeletonCard } from "../../../components/SkeletonCard";
import { HomeStatusToggle } from "../../../components/HomeStatusToggle";
import RatingStars from "../../../components/RatingStars";
import RatingModal from "../../../components/RatingModal";


const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const earnings = useSelector((state: RootState) => state.priest.earnings);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { unreadCount, toggleNotifications, showNotifications } = useNotifications();

  const [loading, setLoading] = useState<boolean>(true);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
  const [currentAvailability, setCurrentAvailability] = useState<any>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    const priestId = userInfo?._id;
    if (!priestId) return;

    if (!isManualRefresh) setLoading(true);

    try {
      const results = await Promise.allSettled([
        priestService.getBookings(priestId),
        priestService.getProfileCompletion(),
        priestService.getProfile(),
        priestService.getRecentReviews(),
        priestService.getPendingActions()
      ]);

      // Dispatch earnings via redux (single source of truth)
      dispatch(getEarnings(priestId));

      const [bookingsRes, completionRes, profileRes, reviewsRes, actionsRes] = results;

      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value;
        const bookings = Array.isArray(data) ? data : data?.data || [];
        setAllBookings(bookings);
      }

      if (completionRes.status === 'fulfilled') {
        setProfileCompletion(completionRes.value);
      }

      if (profileRes.status === 'fulfilled') {
        setCurrentAvailability(profileRes.value.currentAvailability);
      }

      if (reviewsRes.status === 'fulfilled') {
        setRecentReviews(reviewsRes.value);
      }

      if (actionsRes.status === 'fulfilled') {
        setPendingActions(actionsRes.value);
      }

      // Check for any failures and alert if manual refresh
      const hasFailures = results.some(r => r.status === 'rejected');
      if (hasFailures && isManualRefresh) {
        Alert.alert("Warning", "Some data failed to load. Please try again.");
      }

    } catch (err) {
      console.error(err);
      if (isManualRefresh) {
        Alert.alert("Error", "Failed to refresh dashboard.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo?._id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

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
      // Remove from local state immediately so the carousel updates
      setAllBookings(prev => prev.filter(b => b._id !== bookingId));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept");
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await priestService.updateBookingStatus(bookingId, 'cancelled');
      // Remove from local state immediately so the carousel updates
      setAllBookings(prev => prev.filter(b => b._id !== bookingId));
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

  const handleMarkComplete = async (bookingId: string) => {
    try {
      await priestService.updateBookingStatus(bookingId, 'completed');
      Alert.alert("Success", "Booking marked as completed!");
      // Refresh data (ideally optimize this)
      setPendingActions(prev => prev.filter(a => a._id !== bookingId));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to mark as complete");
    }
  };

  const openRateModal = (booking: any) => {
    setSelectedBookingForRating(booking);
    setRateModalVisible(true);
  };

  const handleSubmitRating = async (rating: number, comment: string, tags: string[]) => {
    if (!selectedBookingForRating) return;

    try {
      // Submit review
      await priestService.submitReview({
        bookingId: selectedBookingForRating._id,
        reviewerId: userInfo?._id,
        revieweeId: selectedBookingForRating.devoteeId?._id,
        rating,
        comment,
        tags,
        role: 'priest_to_devotee'
      });

      Alert.alert("Success", "Review submitted!");
      // Remove from pending actions
      setPendingActions(prev => prev.filter(a => a._id !== selectedBookingForRating._id));
    } catch (error: any) {
      console.error("Submit review error:", error);
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setRateModalVisible(false);
      setSelectedBookingForRating(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="light" backgroundColor={APP_COLORS.primary} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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

            {/* Status Toggle */}
            <HomeStatusToggle
              currentStatus={currentAvailability?.status || 'offline'}
              autoToggle={currentAvailability?.autoToggle ?? true}
              onStatusChange={(status) => setCurrentAvailability((prev: any) => ({ ...prev, status }))}
              style={{ marginBottom: 20 }}
            />

            {/* Pending Actions Carousel */}
            {pendingActions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {pendingActions.map((action, index) => (
                    <View key={index} style={styles.actionCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={[styles.actionIcon, { backgroundColor: action.actionType === 'mark_complete' ? APP_COLORS.info + '20' : APP_COLORS.warning + '20' }]}>
                          <Ionicons
                            name={action.actionType === 'mark_complete' ? 'checkmark-circle-outline' : 'star-outline'}
                            size={24}
                            color={action.actionType === 'mark_complete' ? APP_COLORS.info : APP_COLORS.warning}
                          />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.actionTitle}>{action.title}</Text>
                          <Text style={styles.actionDesc} numberOfLines={1}>{action.description}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: action.actionType === 'mark_complete' ? APP_COLORS.info : APP_COLORS.warning }]}
                        onPress={() => action.actionType === 'mark_complete' ? handleMarkComplete(action._id) : openRateModal(action)}
                      >
                        <Text style={styles.actionBtnText}>
                          {action.actionType === 'mark_complete' ? 'Mark Complete' : 'Rate Now'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 1. Dashboard Grid - Earnings & Puja Stats */}
            <View style={styles.dashboardGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>₹{earnings?.thisMonth ?? 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={styles.statValue}>₹{earnings?.availableBalance ?? 0}</Text>
              </View>
            </View>
            <View style={styles.dashboardGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-done-outline" size={20} color={APP_COLORS.success} style={{ marginBottom: 4 }} />
                <Text style={styles.statLabel}>Pujas Completed</Text>
                <Text style={[styles.statValue, { color: APP_COLORS.success }]}>{earnings?.pujasCompleted ?? 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="hourglass-outline" size={20} color={APP_COLORS.warning} style={{ marginBottom: 4 }} />
                <Text style={styles.statLabel}>Pujas Pending</Text>
                <Text style={[styles.statValue, { color: APP_COLORS.warning }]}>{earnings?.pujasPending ?? 0}</Text>
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

            {/* 3. Recent Love */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Love</Text>
                <TouchableOpacity onPress={() => router.push("/priest/(tabs)/ProfileTab" as any)}>
                  <Text style={{ color: APP_COLORS.primary, fontWeight: '600' }}>See All</Text>
                </TouchableOpacity>
              </View>
              {recentReviews.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {recentReviews.slice(0, 4).map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={styles.reviewerAvatar}>
                          <Text style={styles.avatarText}>{review.reviewerId?.name?.charAt(0) || 'D'}</Text>
                        </View>
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.reviewerName}>{review.reviewerId?.name || "Devotee"}</Text>
                          <RatingStars rating={review.rating} size={14} readOnly />
                        </View>
                      </View>
                      <Text numberOfLines={3} style={styles.reviewComment}>"{review.comment}"</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: APP_COLORS.gray, fontStyle: 'italic' }}>No reviews yet.</Text>
              )}
            </View>

            {/* 4. Pending Requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Puja Requests ({pendingRequests.length})</Text>
                  <TouchableOpacity onPress={() => router.push("/priest/(tabs)/RequestsTab" as any)}>
                    <Text style={{ color: APP_COLORS.primary, fontWeight: '600' }}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {pendingRequests.map((req, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.requestCard}
                      activeOpacity={0.7}
                      onPress={() => router.push({
                        pathname: "/priest/(priestScreens)/PujaRequestDetails" as any,
                        params: { bookingId: req._id },
                      })}
                    >
                      <View style={styles.reqCardTop}>
                        <View style={styles.reqPendingBadge}>
                          <Text style={styles.reqPendingText}>PENDING</Text>
                        </View>
                        <Text style={styles.reqPrice}>₹{req.basePrice}</Text>
                      </View>
                      <Text style={styles.reqTitle} numberOfLines={1}>{req.ceremonyType || req.ceremony}</Text>
                      <View style={styles.reqDetailRow}>
                        <Ionicons name="person-outline" size={13} color={APP_COLORS.gray} />
                        <Text style={styles.reqClient} numberOfLines={1}>{req.devoteeId?.name || 'Devotee'}</Text>
                      </View>
                      <View style={styles.reqDetailRow}>
                        <Ionicons name="calendar-outline" size={13} color={APP_COLORS.gray} />
                        <Text style={styles.reqDate}>{new Date(req.date).toLocaleDateString()}{req.startTime ? ` • ${req.startTime}` : ''}</Text>
                      </View>
                      <View style={styles.reqTapHint}>
                        <Ionicons name="chevron-forward" size={14} color={APP_COLORS.primary} />
                      </View>
                    </TouchableOpacity>
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

      {/* Rating Modal */}
      <RatingModal
        isVisible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        onSubmit={handleSubmitRating}
        role="priest"
        bookingDetails={selectedBookingForRating ? {
          ceremonyType: selectedBookingForRating.ceremonyType,
          date: selectedBookingForRating.date,
          clientName: selectedBookingForRating.devoteeId?.name
        } : undefined}
      />
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
    padding: 12,
    borderRadius: 14,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.warning,
  },
  reqCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reqPendingBadge: {
    backgroundColor: APP_COLORS.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reqPendingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: APP_COLORS.warning,
  },
  reqPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.success,
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 4,
  },
  reqDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  reqClient: {
    fontSize: 12,
    color: APP_COLORS.gray,
    flex: 1,
  },
  reqDate: {
    fontSize: 11,
    color: APP_COLORS.gray,
  },
  reqTapHint: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: APP_COLORS.gray,
    fontSize: 16,
  },
  reviewCard: {
    backgroundColor: APP_COLORS.white,
    width: 220,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    elevation: 2,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.black,
  },
  reviewComment: {
    lineHeight: 20
  },
  actionCard: {
    backgroundColor: APP_COLORS.white,
    width: 280,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.primary
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 2
  },
  actionDesc: {
    fontSize: 12,
    color: APP_COLORS.gray
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  actionBtnText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default HomeScreen;
