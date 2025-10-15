import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import priestService from "../../../services/priestService";

const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({
    thisMonth: 0,
    growthPercentage: 0,
    availableBalance: 0,
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  // const [showProfileBanner, setShowProfileBanner] = useState<boolean>(true);
  // const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Ceremonies examples
  const ceremonies = [
    {
      id: "1",
      name: "Wedding",
      image: require("../../../assets/images/wedding.jpg"),
    },
    {
      id: "2",
      name: "Housewarming",
      image: require("../../../assets/images/housewarming.png"),
    },
    {
      id: "3",
      name: "Baby Naming",
      image: require("../../../assets/images/baby-naming.jpg"),
    },
  ];

  
      // console.log("userInfo in HomeScreen:", userInfo);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const priestId = userInfo?._id;
      if (!priestId) {
        setLoading(false);
        return;
      }

      setLoading(true);


      // Bookings
      try {
        const bookings = await priestService.getBookings(priestId);
        if (!mounted) return;
        const arr = Array.isArray(bookings) ? bookings : bookings?.data || [];
        setUpcomingBookings(arr.slice(0, 3));
      } catch (err) {
        console.warn("bookings fetch failed", err);
        if (!mounted) return;
        setUpcomingBookings([]);
      }

      // Earnings
      try {
        const e = await priestService.getEarnings(priestId);
        if (!mounted) return;
        const normalized = e?.data ||
          e || { thisMonth: 0, growthPercentage: 0, availableBalance: 0 };
        setEarnings(normalized);
      } catch (err) {
        console.warn("earnings fetch failed", err);
        if (!mounted) return;
        setEarnings({ thisMonth: 0, growthPercentage: 0, availableBalance: 0 });
      }

      // Notifications & Reviews - default examples
      setNotifications([
        { id: "1", message: "New booking request from Rahul", read: false },
        { id: "2", message: "Your earnings have been updated", read: true },
      ]);
      setRecentReviews([
        { id: "1", devotee: "Anita", rating: 5, comment: "Excellent service!" },
      ]);

      if (mounted) setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userInfo?._id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visibleBookings = useMemo(
    () => upcomingBookings.filter((b) => b && b.category !== "completed"),
    [upcomingBookings]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <View style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 24, flexGrow: 1 }} style={styles.container}>
          <View style={[styles.header, { paddingTop: 24, paddingBottom: 24 }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerContent}>
                <Text style={styles.welcomeText}>{`Welcome, ${
                  userInfo?.name || "Pandi"
                }`}</Text>
                <Text style={styles.headerTitle}>Your Dashboard</Text>
                <Text style={styles.headerSubtitle}>
                  Manage your ceremonies, bookings, and earnings
                </Text>
              </View>

              <TouchableOpacity
                style={styles.notificationBell}
                onPress={() => router.push("/priest/NotificationsTab")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={APP_COLORS.white}
                />
                {unreadCount > 0 && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
          ) : (
            <View>
              {/* Earnings Card */}
              <View style={styles.earningsCard}>
                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsLabel}>Earnings This Month</Text>
                  <View style={styles.earningsRow}>
                    <Text style={styles.earningsAmount}>
                      ₹{(earnings?.thisMonth ?? 0).toLocaleString("en-IN")}
                    </Text>
                    {earnings?.growthPercentage !== undefined &&
                      earnings.growthPercentage !== 0 && (
                        <View style={styles.earningsTrend}>
                          <Ionicons
                            name={
                              earnings.growthPercentage >= 0
                                ? "arrow-up"
                                : "arrow-down"
                            }
                            size={16}
                            color={
                              earnings.growthPercentage >= 0
                                ? APP_COLORS.success
                                : APP_COLORS.error
                            }
                          />
                          <Text
                            style={[
                              styles.earningsTrendText,
                              {
                                color:
                                  earnings.growthPercentage >= 0
                                    ? APP_COLORS.success
                                    : APP_COLORS.error,
                              },
                            ]}
                          >
                            {earnings.growthPercentage >= 0 ? "+" : ""}
                            {Math.abs(earnings.growthPercentage)}%
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.withdrawButton,
                    (!earnings?.availableBalance ||
                      earnings.availableBalance === 0) &&
                      styles.withdrawButtonDisabled,
                  ]}
                  onPress={() => router.push("/priest/EarningsTab")}
                  disabled={
                    !earnings?.availableBalance ||
                    earnings.availableBalance === 0
                  }
                >
                  <Text
                    style={[
                      styles.withdrawButtonText,
                      (!earnings?.availableBalance ||
                        earnings.availableBalance === 0) &&
                        styles.withdrawButtonTextDisabled,
                    ]}
                  >
                    {!earnings?.availableBalance ||
                    earnings.availableBalance === 0
                      ? "No Earnings"
                      : "Withdraw"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ceremonies */}
              <View style={styles.ceremoniesContainer}>
                <Text style={styles.sectionTitle}>Your Ceremonies</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.ceremoniesScroll}
                >
                  {ceremonies.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.ceremonyCard}
                      onPress={() => router.push("/AvailableOffers")}
                    >
                      <Image source={c.image} style={styles.ceremonyImage} />
                      <View style={styles.ceremonyOverlay} />
                      <Text style={styles.ceremonyName}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Upcoming Bookings */}
              <View style={styles.upcomingBookingsContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                  <TouchableOpacity
                    onPress={() => router.push("/priest/BookingsTab")}
                  >
                    <Text style={styles.viewAllTextSmall}>View All</Text>
                  </TouchableOpacity>
                </View>

                {visibleBookings.length ? (
                  visibleBookings.map((b, idx) => (
                    <View
                      key={b._id || b.id || `booking-${idx}`}
                      style={styles.upcomingBookingCard}
                    >
                      <View style={styles.upcomingBookingContent}>
                        <Ionicons
                          name="calendar"
                          size={24}
                          color={APP_COLORS.primary}
                        />
                        <View style={{ flex: 1, flexWrap: "wrap" }}>
                          <Text
                            style={styles.upcomingBookingText}
                            numberOfLines={3}
                            ellipsizeMode="tail"
                          >
                            {b.ceremonyType || b.ceremony} for{" "}
                            {b.devoteeId?.name || b.devotee} on{" "}
                            {b.date
                              ? new Date(b.date).toLocaleDateString()
                              : ""}{" "}
                            at {b.startTime || b.time}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noBookingsContainer}>
                    <Text style={styles.noBookingsText}>
                      No bookings available
                    </Text>
                  </View>
                )}
              </View>

              {/* Recent Reviews */}
              {recentReviews.length > 0 && (
                <View style={styles.reviewsContainer}>
                  <Text style={styles.sectionTitle}>Recent Reviews</Text>
                  {recentReviews.map((r) => (
                    <View key={r.id} style={styles.reviewItem}>
                      <Text style={styles.reviewDevotee}>
                        {r.devotee || r.reviewer}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < (r.rating || 0) ? "star" : "star-outline"}
                            size={16}
                            color={APP_COLORS.primary}
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  header: {
    backgroundColor: APP_COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: { paddingHorizontal: 16 },
  welcomeText: {
    color: APP_COLORS.white,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: { color: APP_COLORS.white, opacity: 0.9, fontSize: 14 },
  ceremoniesContainer: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ceremoniesScroll: { paddingLeft: 16, paddingRight: 8 },
  ceremonyCard: {
    width: 140,
    height: 180,
    borderRadius: 10,
    marginRight: 12,
    overflow: "hidden",
  },
  ceremonyImage: { width: "100%", height: "100%" },
  ceremonyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  ceremonyName: {
    position: "absolute",
    bottom: 16,
    left: 12,
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },

  upcomingBookingsContainer: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllTextSmall: { color: APP_COLORS.primary, fontSize: 14 },
  upcomingBookingCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    marginBottom: 12,
  },
  upcomingBookingContent: { flexDirection: "row", alignItems: "flex-start" },
  upcomingBookingText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
    width: "100%",
  },
  noBookingsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  noBookingsText: { color: APP_COLORS.gray, fontSize: 14 },

  earningsCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    justifyContent: "space-between",
  },
  earningsInfo: { flex: 1 },
  earningsLabel: { color: APP_COLORS.gray, fontSize: 14, marginBottom: 4 },
  earningsRow: { flexDirection: "row", alignItems: "center" },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: APP_COLORS.primary,
    marginRight: 12,
  },
  earningsTrend: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.success + "20",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  earningsTrendText: {
    color: APP_COLORS.success,
    fontSize: 14,
    marginLeft: 2,
    fontWeight: "bold",
  },
  withdrawButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 16,
  },
  withdrawButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  withdrawButtonDisabled: { backgroundColor: APP_COLORS.lightGray },
  withdrawButtonTextDisabled: { color: APP_COLORS.gray },

  reviewsContainer: { marginBottom: 24 },
  reviewItem: { paddingVertical: 12, paddingHorizontal: 16 },
  reviewDevotee: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: APP_COLORS.primary,
  },
  reviewStars: { flexDirection: "row", marginBottom: 6 },
  reviewComment: { fontSize: 13, color: APP_COLORS.gray },

  tipsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    borderRadius: 6,
    margin: 10,
    padding: 6,
    elevation: 1,
  },
  tipsBannerText: {
    color: APP_COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  notificationBell: { marginTop: 8, marginRight: 8, position: "relative" },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.error,
    borderWidth: 1,
    borderColor: APP_COLORS.white,
  },
  notificationPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 16,
    padding: 8,
    elevation: 1,
  },
  notificationPreviewText: { color: APP_COLORS.info, fontSize: 13, flex: 1 },
});

export default HomeScreen;
