import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
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
  const [completionRate, setCompletionRate] = useState<number>(100);
  const [ceremonyCount, setCeremonyCount] = useState<number>(0);
  const [verificationStatus, setVerificationStatus] = useState<string>('incomplete');
  const [rejectionReason, setRejectionReason] = useState<string>('');

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
        const p = profileRes.value;
        setCurrentAvailability(p.currentAvailability);
        // setIsVerified(p.profile?.isVerified ?? p.isVerified ?? false); // Removed from state, now using verificationStatus === 'approved'
        setVerificationStatus(p.profile?.verificationStatus ?? p.verificationStatus ?? 'incomplete');
        setRejectionReason(p.profile?.rejectionReason ?? p.rejectionReason ?? '');
        setCompletionRate(p.analytics?.completionRate ?? 100);
        setCeremonyCount(p.ceremonyCount ?? 0);
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

  // Poll for updates every 30s if there are active bookings
  useEffect(() => {
    const hasActive = allBookings.some(b => !['completed', 'cancelled'].includes(b.status));
    if (!hasActive) return;

    const id = setInterval(() => loadData(true), 30000);
    return () => clearInterval(id);
  }, [allBookings, loadData]);

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
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>
          <LinearGradient
            colors={["#FFFFFF", "#FDFBF7"]}
            style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: 24 }]}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Sacred Connect</Text>
                <Text style={styles.headerSubtitle}>Namaste, {userInfo?.name?.split(' ')[0] || 'Pandit ji'}</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.notificationBtn}
                  onPress={toggleNotifications}
                >
                  <Ionicons
                    name={showNotifications ? "notifications" : "notifications-outline"}
                    size={24}
                    color={APP_COLORS.tertiary}
                  />
                  {unreadCount > 0 && <View style={styles.notificationBadge} />}
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Profile Completion */}
          {!loading && profileCompletion && profileCompletion.completionPercentage < 100 && (
            <ProfileCompletionBanner data={profileCompletion} />
          )}

          {/* Verification Status Card */}
          {!loading && (
            <View style={styles.statusSection}>
              {verificationStatus === 'pending' ? (
                <View style={[styles.statusBanner, { backgroundColor: APP_COLORS.saffronLight, borderLeftColor: APP_COLORS.primary }]}>
                  <Ionicons name="time" size={24} color={APP_COLORS.primary} />
                  <View style={styles.bannerContent}>
                    <Text style={[styles.bannerTitle, { color: APP_COLORS.primary }]}>Application Under Review</Text>
                    <Text style={styles.bannerText}>Our team is currently verifying your profile and documents. You'll be notified once you're approved to start receiving bookings.</Text>
                  </View>
                </View>
              ) : verificationStatus === 'rejected' ? (
                <View style={[styles.statusBanner, { backgroundColor: APP_COLORS.error + "12", borderLeftColor: APP_COLORS.error }]}>
                  <Ionicons name="close-circle" size={24} color={APP_COLORS.error} />
                  <View style={styles.bannerContent}>
                    <Text style={[styles.bannerTitle, { color: APP_COLORS.error }]}>Application Rejected</Text>
                    <Text style={styles.bannerText}>{rejectionReason || "Please check your documents and try again."}</Text>
                    <TouchableOpacity 
                      style={[styles.bannerBtn, { backgroundColor: APP_COLORS.error }]}
                      onPress={() => router.push("/priest/(priestScreens)/OnboardingWizard" as any)}
                    >
                      <Text style={styles.bannerBtnText}>Update Documents</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : verificationStatus === 'incomplete' ? (
                <TouchableOpacity
                  style={[styles.statusBanner, { backgroundColor: APP_COLORS.warning + "12", borderLeftColor: APP_COLORS.warning }]}
                  onPress={() => router.push("/priest/(priestScreens)/OnboardingWizard" as any)}
                >
                  <Ionicons name="shield-half-outline" size={24} color={APP_COLORS.warning} />
                  <View style={styles.bannerContent}>
                    <Text style={[styles.bannerTitle, { color: APP_COLORS.warning }]}>Complete Your Profile</Text>
                    <Text style={styles.bannerText}>Finish onboarding to start receiving bookings and build your presence on Sacred Connect.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={APP_COLORS.warning} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Reliability Warning Banner */}
          {!loading && ceremonyCount >= 5 && completionRate < 70 && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: APP_COLORS.error + "12",
              marginHorizontal: 20,
              marginBottom: 12,
              padding: 14,
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: APP_COLORS.error,
            }}>
              <Ionicons name="warning" size={24} color={APP_COLORS.error} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontWeight: "bold", color: APP_COLORS.error, fontSize: 14 }}>
                  Low Reliability Score
                </Text>
                <Text style={{ fontSize: 12, color: APP_COLORS.gray, marginTop: 2, lineHeight: 18 }}>
                  Your completion rate has dropped to {completionRate}%. Completing bookings on time will improve your ranking and visibility.
                </Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={{ padding: 20 }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.content}>

              {/* Status Toggle - Only show when approved to avoid redundancy with banners above */}
              {verificationStatus === 'approved' && (
                <HomeStatusToggle
                  currentStatus={currentAvailability?.status || 'offline'}
                  autoToggle={currentAvailability?.autoToggle ?? true}
                  isVerified={verificationStatus === 'approved'}
                  completionPercentage={profileCompletion?.completionPercentage || 0}
                  onStatusChange={(status) => setCurrentAvailability((prev: any) => ({ ...prev, status }))}
                  style={{ marginBottom: 20 }}
                  disabled={verificationStatus !== 'approved'}
                />
              )}

              {/* Pending Actions Carousel */}
              {pendingActions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pending Actions</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {pendingActions.map((action, index) => (
                      <View key={index} style={styles.actionCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View style={[styles.actionIcon, { backgroundColor: action.actionType === 'mark_complete' ? APP_COLORS.primary + '20' : APP_COLORS.warning + '20' }]}>
                            <Ionicons
                              name={action.actionType === 'mark_complete' ? 'checkmark-circle-outline' : 'star-outline'}
                              size={24}
                              color={action.actionType === 'mark_complete' ? APP_COLORS.primary : APP_COLORS.warning}
                            />
                          </View>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                            <Text style={styles.actionDesc} numberOfLines={1}>{action.description}</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: action.actionType === 'mark_complete' ? APP_COLORS.primary : APP_COLORS.warning }]}
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
        </View>
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
  container: { flex: 1, backgroundColor: APP_COLORS.neutral },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: APP_COLORS.tertiary,
    shadowOpacity: 0.06,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerTitle: {
    color: APP_COLORS.tertiary,
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: APP_COLORS.secondary,
    fontFamily: 'serif',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.error,
    borderWidth: 2,
    borderColor: APP_COLORS.white,
  },
  content: {
    padding: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
  },
  statLabel: {
    fontSize: 12,
    color: APP_COLORS.secondary,
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
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
    marginBottom: 12,
  },
  upNextCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
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
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
    flex: 1,
  },
  badge: {
    backgroundColor: APP_COLORS.saffronLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    color: APP_COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: APP_COLORS.secondary,
  },
  actionButton: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 100,
    marginTop: 16,
    gap: 8,
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: APP_COLORS.white,
    width: 280,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
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
    color: APP_COLORS.tertiary,
    fontFamily: 'serif',
    marginBottom: 2
  },
  actionDesc: {
    fontSize: 12,
    color: APP_COLORS.secondary
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
  },
  requestCard: {
    backgroundColor: APP_COLORS.white,
    width: 200,
    padding: 12,
    borderRadius: 16,
    marginRight: 10,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
  },
  reqCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reqPendingBadge: {
    backgroundColor: APP_COLORS.saffronLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  reqPendingText: {
    fontSize: 9,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  reqPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
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
    color: APP_COLORS.secondary,
    flex: 1,
  },
  reqDate: {
    fontSize: 11,
    color: APP_COLORS.secondary,
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
    color: APP_COLORS.secondary,
    fontSize: 16,
    fontFamily: 'serif',
  },
  reviewCard: {
    backgroundColor: APP_COLORS.white,
    width: 220,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
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
    color: APP_COLORS.tertiary,
  },
  reviewComment: {
    lineHeight: 20,
    color: APP_COLORS.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: APP_COLORS.white,
    elevation: 3,
    shadowColor: APP_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  bannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: APP_COLORS.secondary,
    lineHeight: 18,
  },
  bannerBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: APP_COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
