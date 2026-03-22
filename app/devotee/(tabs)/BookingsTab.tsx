import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDispatch, useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { getBookings } from "../../../redux/slices/bookingSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import { formatCurrency } from "../../../utils/formatUtlis";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";



// ─── Component ────────────────────────────────────────────────────────────
const BookingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const { bookings, isLoading, error } = useSelector((state: RootState) => state.booking);

  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userInfo) {
      dispatch(getBookings());
    }
  }, [dispatch, userInfo]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (userInfo) await dispatch(getBookings());
    } finally {
      setRefreshing(false);
    }
  };

  // Filtering logic
  const upcomingBookings = (bookings || []).filter((b: any) => {
    return (b.status === "confirmed" || b.status === "pending" || b.status === "requested" || b.status === "accepted");
  });

  const historyBookings = (bookings || []).filter((b: any) => {
    return b.status === "completed" || b.status === "cancelled";
  });

  const displayBookings = activeTab === "upcoming" ? upcomingBookings : historyBookings;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { bg: "#E8F5E9", color: APP_COLORS.success, label: "Confirmed", icon: "checkmark-circle" as const };
      case "completed":
        return { bg: "#E3F2FD", color: APP_COLORS.info, label: "Completed", icon: "checkmark-done-circle" as const };
      case "cancelled":
        return { bg: "#FFEBEE", color: APP_COLORS.error, label: "Cancelled", icon: "close-circle" as const };
      case "pending":
        return { bg: "#FFF8E1", color: APP_COLORS.warning, label: "Payment Pending", icon: "time" as const };
      case "requested":
        return { bg: "#FFF3E0", color: "#F57C00", label: "Pending Acceptance", icon: "hourglass-outline" as const };
      default:
        return { bg: APP_COLORS.lightGray, color: APP_COLORS.gray, label: status, icon: "ellipse" as const };
    }
  };

  const handleBookingPress = (booking: any) => {
    if (booking._id?.startsWith("mock")) return;
    router.push({ 
      pathname: "/BookingDetails", 
      params: { 
        booking: JSON.stringify(booking),
        bookingId: booking._id 
      } 
    });
  };

  const handleRateNow = (booking: any) => {
    router.push({ 
      pathname: "/Ratings", 
      params: { 
        booking: JSON.stringify(booking),
        bookingId: booking._id || booking.id,
        priestId: booking.priestId?._id || booking.priestId
      } 
    });
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.status || "");
    const bookingDate = new Date(item.date);
    const formattedDate = bookingDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const isUpcoming = activeTab === "upcoming";

    return (
      <Card style={StyleSheet.flatten([styles.bookingCard, isUpcoming && styles.bookingCardUpcoming]) as any} onPress={() => handleBookingPress(item)}>
        {/* Status Ribbon */}
        <View style={styles.cardHeader}>
          <Text style={styles.ceremonyType}>{item.ceremonyType}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Priest */}
        <View style={styles.priestRow}>
          <Ionicons name="person-circle" size={20} color={APP_COLORS.gray} />
          <Text style={styles.priestName}>{item.priestName}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={15} color={APP_COLORS.gray} />
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={15} color={APP_COLORS.gray} />
            <Text style={styles.detailText}>{item.startTime} - {item.endTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={15} color={APP_COLORS.gray} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location?.address}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            {formatCurrency ? formatCurrency(item.basePrice) : `₹${item.basePrice}`}
          </Text>

          {isUpcoming && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => {
                const id = item._id || item.id;
                // Skip navigation for mock/placeholder bookings
                if (!id || id.length !== 24) {
                  Alert.alert("Info", "Samagri details will be available once a real booking is created.");
                  return;
                }
                router.push({
                  pathname: "/(devoteeScreens)/(bookings)/BookingDetails",
                  params: { bookingId: id, booking: JSON.stringify(item) }
                });
              }}>
                <Ionicons name="list-outline" size={18} color={APP_COLORS.saffron} />
                <Text style={styles.iconButtonLabel}>Samagri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => Linking.openURL("tel:+911234567890")}>
                <Ionicons name="call-outline" size={18} color={APP_COLORS.success} />
                <Text style={styles.iconButtonLabel}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => { }}>
                <Ionicons name="navigate-outline" size={18} color={APP_COLORS.info} />
                <Text style={styles.iconButtonLabel}>Map</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isUpcoming && item.status === "completed" && !item.rated && (
            <PrimaryButton
              title="Rate Priest"
              onPress={() => handleRateNow(item)}
              size="sm"
              style={{ borderRadius: 12 }}
            />
          )}

          {!isUpcoming && item.status === "completed" && item.rated && (
            <View style={styles.ratedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={APP_COLORS.success} />
              <Text style={styles.ratedText}>Rated</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.saffron} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={22} color={APP_COLORS.saffron} />
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === "upcoming" && styles.segmentActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.segmentText, activeTab === "upcoming" && styles.segmentTextActive]}>
            Upcoming ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === "history" && styles.segmentActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.segmentText, activeTab === "history" && styles.segmentTextActive]}>
            History ({historyBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {displayBookings.length > 0 ? (
        <FlatList
          data={displayBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item: any) => item._id || Math.random().toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_COLORS.saffron]} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={60} color={APP_COLORS.lightGray} />
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "upcoming"
              ? "Book a puja and it will show up here"
              : "Your completed ceremonies will appear here"}
          </Text>
          {activeTab === "upcoming" && (
            <PrimaryButton
              title="Explore Pujas"
              onPress={() => router.navigate("/devotee/(tabs)/ExploreTab" as any)}
              style={{ marginTop: 16 }}
            />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: APP_COLORS.gray,
  },

  // Header
  header: {
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.headingText,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: APP_COLORS.lightGray,
    borderRadius: 16,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: APP_COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.gray,
  },
  segmentTextActive: {
    color: APP_COLORS.saffron,
    fontWeight: "700",
  },

  // Booking Card
  bookingCard: {
    marginBottom: 14,
  },
  bookingCardUpcoming: {
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.saffron,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ceremonyType: {
    fontSize: 17,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  priestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  priestName: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontWeight: "500",
  },
  detailsGrid: {
    gap: 6,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: APP_COLORS.bodyText,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.divider,
    paddingTop: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: APP_COLORS.headingText,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 14,
  },
  iconButton: {
    alignItems: "center",
    gap: 2,
  },
  iconButtonLabel: {
    fontSize: 10,
    color: APP_COLORS.gray,
    fontWeight: "500",
  },
  ratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratedText: {
    fontSize: 12,
    color: APP_COLORS.success,
    fontWeight: "600",
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: APP_COLORS.bodyText,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default BookingsScreen;
