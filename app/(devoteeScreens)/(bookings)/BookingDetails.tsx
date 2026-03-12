import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import { useQuery } from "@tanstack/react-query";
import devoteeService from "../../../services/devoteeService";

const BookingDetailsScreen: React.FC = () => {
  // Helper functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== "number") return "₹0";
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "arrived":
        return "Priest Arrived";
      case "in_progress":
        return "In Progress";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return APP_COLORS.success;
      case "pending":
        return APP_COLORS.warning;
      case "completed":
        return APP_COLORS.info;
      case "arrived":
        return APP_COLORS.info;
      case "in_progress":
        return APP_COLORS.primary;
      case "cancelled":
        return APP_COLORS.error;
      default:
        return APP_COLORS.gray;
    }
  };

  const params = useLocalSearchParams();
  const { bookingId: queryBookingId, booking: stringifiedBooking } = params;

  // 1. Initial booking from params
  const [booking, setBooking] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (stringifiedBooking) {
      try {
        setBooking(typeof stringifiedBooking === 'string' ? JSON.parse(stringifiedBooking) : stringifiedBooking);
      } catch (err) {
        console.error("Failed to parse booking param", err);
      }
    }
  }, [stringifiedBooking]);

  // 2. Fetch booking
  const { 
    data: fetchedBooking, 
    isLoading: isFetching,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ['booking', queryBookingId],
    queryFn: async () => {
      const resp = await devoteeService.getBookingDetails(queryBookingId as string);
      return resp;
    },
    enabled: !!queryBookingId,
    // Refetch every 10 seconds if booking is active (not terminal)
    refetchInterval: (data) => {
      const status = data?.status || booking?.status;
      return (status && !['completed', 'cancelled'].includes(status)) ? 10000 : false;
    }
  });

  // Refetch when screen focused
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 3. Update state when fetched
  useEffect(() => {
    if (fetchedBooking) {
      setBooking(fetchedBooking);
    }
  }, [fetchedBooking]);

  const loading = isFetching && !booking;

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!booking?.date) return;
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(booking.date).getTime();
      const diff = target - now;
      if (diff <= 0) { setCountdown(null); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let text = '';
      if (days > 0) text += `${days} day${days > 1 ? 's' : ''} `;
      if (hours > 0) text += `${hours} hr${hours > 1 ? 's' : ''} `;
      text += `${mins} min${mins > 1 ? 's' : ''}`;
      setCountdown(text.trim());
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [booking?.date]);

  const handleCancelBooking = async () => {
    if (!booking) return;

    const now = new Date().getTime();
    const target = new Date(booking.date);
    const [hours, minutes] = (booking.startTime || '00:00').split(':').map(Number);
    target.setHours(hours, minutes, 0, 0);

    const diffHours = (target.getTime() - now) / (1000 * 60 * 60);

    let warningMessage = "Are you sure you want to cancel this booking?";
    let subMessage = "";

    if (diffHours > 72) {
      subMessage = "Cancellation policy: Full refund applies as you are cancelling more than 72 hours in advance.";
    } else if (diffHours >= 24) {
      subMessage = "Cancellation policy: You will be refunded the base price, but the platform fee will be retained as a late cancellation fee.";
    } else {
      subMessage = "Cancellation policy: Cancellations within 24 hours are non-refundable. The amount will be processed as compensation for the priest.";
    }

    if (booking.status === "arrived" || booking.status === "in_progress") {
      subMessage = "Important: The priest has already arrived or started the ritual. Cancellation at this stage is non-refundable and may affect your reliability score significantly.";
    }

    Alert.alert(
      "Cancel Booking",
      `${warningMessage}\n\n${subMessage}`,
      [
        { text: "Keep Booking", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsUpdating(true);
              await devoteeService.cancelBooking(booking._id, { reason: "Cancelled by devotee" });
              Alert.alert("Success", "Booking cancelled successfully.");
              router.push("/devotee/BookingsTab");
            } catch (err: any) {
              Alert.alert("Error", err || "Failed to cancel booking.");
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleCallPriest = () => {
    const phone = booking?.priestId?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleMessagePriest = () => {
    const phone = booking?.priestId?.phone;
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    }
  };

  const handleGetDirections = () => {
    if (booking?.location?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        booking.location.address
      )}`;
      Linking.openURL(url);
    }
  };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/devotee/BookingsTab")}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => router.push("/devotee/BookingsTab")}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(booking.status)}
            </Text>
          </View>
          <Text style={styles.bookingId}>
            Booking ID: {booking._id || booking.id || "-"}
          </Text>
        </View>

        {/* Ceremony Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ceremony Details</Text>
          <View style={styles.ceremonyCard}>
            {(booking?.ceremony?.image || booking?.ceremony?.images?.[0]?.url) && (
              <Image
                source={{ uri: booking.ceremony.image || booking.ceremony.images?.[0]?.url }}
                style={styles.ceremonyImage}
              />
            )}
            <View style={styles.ceremonyInfo}>
              <Text style={styles.ceremonyName}>
                {booking?.ceremony?.name || booking?.ceremonyType || "-"}
              </Text>
              <Text style={styles.ceremonyType}>
                {booking?.ceremony?.type || "Ceremony"}
              </Text>
              {booking?.ceremony?.duration && (
                <Text style={styles.ceremonyDuration}>
                  Duration: {booking.ceremony.duration}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={20} color={APP_COLORS.primary} />
              <Text style={styles.scheduleText}>
                {formatDate(booking.date)}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={20} color={APP_COLORS.primary} />
              <Text style={styles.scheduleText}>
                {booking?.startTime && booking?.endTime
                  ? `${booking.startTime} - ${booking.endTime}`
                  : booking?.time || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Countdown Timer */}
        {countdown && (booking?.status === "pending" || booking?.status === "confirmed") && (
          <View style={styles.section}>
            <View style={styles.countdownCard}>
              <Ionicons name="timer-outline" size={20} color={APP_COLORS.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.countdownLabel}>Starts in</Text>
                <Text style={styles.countdownValue}>{countdown}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Priest Information */}
        {booking?.priestId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priest Information</Text>
            <View style={styles.devoteeCard}>
              {booking.priestId.profilePicture && (
                <Image
                  source={{ uri: booking.priestId.profilePicture }}
                  style={styles.devoteeImage}
                />
              )}
              <View style={styles.devoteeInfo}>
                <Text style={styles.devoteeName}>
                  {booking.priestId.name || "-"}
                </Text>
                <Text style={styles.devoteeEmail}>
                  {booking.priestId.email || "-"}
                </Text>
              </View>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleCallPriest}
                >
                  <Ionicons name="call" size={18} color={APP_COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleMessagePriest}
                >
                  <Ionicons
                    name="chatbubble"
                    size={18}
                    color={APP_COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color={APP_COLORS.primary} />
              <View style={styles.locationText}>
                <Text style={styles.address}>
                  {booking?.location?.address || "-"}
                </Text>
                {booking?.location?.landmark && (
                  <Text style={styles.landmark}>
                    Landmark: {booking.location.landmark}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentAmount}>
                {formatCurrency(booking?.totalAmount || booking?.amount || 0)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Advance Paid:</Text>
              <Text style={styles.paymentAdvance}>
                {formatCurrency(booking?.advance || 0)}
              </Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <Text style={styles.paymentLabel}>Remaining:</Text>
              <Text style={styles.paymentRemaining}>
                {formatCurrency(booking?.remaining || 0)}
              </Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentStatusLabel}>Payment Status: </Text>
              <Text
                style={[
                  styles.paymentStatusText,
                  {
                    color:
                      booking?.paymentStatus === "paid"
                        ? APP_COLORS.success
                        : APP_COLORS.warning,
                  },
                ]}
              >
                {(booking?.paymentStatus || "pending").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Requests */}
        {booking?.specialRequests && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <View style={styles.requestsCard}>
              <Text style={styles.requestsText}>{booking.specialRequests}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {(booking?.status === "pending" || 
            booking?.status === "confirmed" || 
            booking?.status === "arrived" || 
            booking?.status === "in_progress") && (
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.cancelButton,
                isUpdating && { opacity: 0.5 }
              ]}
              onPress={handleCancelBooking}
              disabled={isUpdating}
            >
              <Text style={styles.actionButtonText}>
                {isUpdating ? "Cancelling..." : "Cancel Booking"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.backToBookingsButton}
          onPress={() => router.push("/devotee/BookingsTab")}
        >
          <Text style={styles.backToBookingsText}>Back to All Bookings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statusText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  bookingId: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontWeight: "500",
  },
  ceremonyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  ceremonyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  ceremonyInfo: {
    flex: 1,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  ceremonyType: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 2,
  },
  ceremonyDuration: {
    fontSize: 12,
    color: APP_COLORS.info,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  scheduleText: {
    fontSize: 15,
    color: APP_COLORS.black,
    marginLeft: 8,
  },
  devoteeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  devoteeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  devoteeInfo: {
    flex: 1,
  },
  devoteeName: {
    fontSize: 15,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  devoteeEmail: {
    fontSize: 13,
    color: APP_COLORS.gray,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 8,
  },
  contactButton: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 20,
    padding: 8,
    marginLeft: 4,
  },
  locationCard: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  address: {
    fontSize: 15,
    color: APP_COLORS.black,
    fontWeight: "bold",
  },
  landmark: {
    fontSize: 13,
    color: APP_COLORS.gray,
  },
  directionsButton: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  directionsButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  paymentAdvance: {
    fontSize: 15,
    color: APP_COLORS.info,
    fontWeight: "bold",
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
    paddingTop: 6,
  },
  paymentRemaining: {
    fontSize: 15,
    color: APP_COLORS.error,
    fontWeight: "bold",
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  paymentStatusLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  paymentStatusText: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 4,
  },
  requestsCard: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  requestsText: {
    fontSize: 15,
    color: APP_COLORS.black,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary,
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: APP_COLORS.success,
  },
  cancelButton: {
    backgroundColor: APP_COLORS.error,
  },
  completeButton: {
    backgroundColor: APP_COLORS.info,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: APP_COLORS.error,
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backIcon: {
    padding: 5,
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  backToBookingsButton: {
    padding: 12,
    alignItems: "center",
  },
  backToBookingsText: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
  },
  countdownCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.primary + "10",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.primary,
  },
  countdownLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  detailLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginTop: 8,
    marginBottom: 2,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: APP_COLORS.black,
    marginBottom: 4,
    fontWeight: "bold",
  },
});

export default BookingDetailsScreen;
