import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { schedulePujaReminder } from "../../../utils/notificationUtils";
import { getImageUri } from "../../../utils/imageUtils";

export default function BookingDetailsScreen() {
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
      case "requested":
        return "Pending Acceptance";
      case "pending":
        return "Payment Pending";
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
      case "requested":
        return APP_COLORS.warning;
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

  console.log('[BookingDetails] params:', { queryBookingId, hasStringifiedBooking: !!stringifiedBooking });

  // 1. Initial booking from params
  const [booking, setBooking] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (stringifiedBooking && typeof stringifiedBooking === 'string') {
      try {
        const parsed = JSON.parse(stringifiedBooking);
        console.log('[BookingDetails] Parsed from params:', { 
          id: parsed._id, 
          status: parsed.status, 
          ceremonyType: parsed.ceremonyType,
          hasCeremonyDetails: !!parsed.ceremonyDetails,
          hasLocation: !!parsed.location,
          date: parsed.date
        });
        setBooking(parsed);
      } catch (err) {
        console.error("Failed to parse booking param", err);
      }
    } else if (stringifiedBooking) {
      setBooking(stringifiedBooking);
    }
  }, [stringifiedBooking]);

  // 2. Fetch booking from API (enriched with ceremonyDetails)
  const { 
    data: fetchedBooking, 
    isLoading: isFetching,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ['booking', queryBookingId],
    queryFn: async () => {
      console.log('[BookingDetails] Fetching from API for id:', queryBookingId);
      const resp = await devoteeService.getBookingDetails(queryBookingId as string);
      console.log('[BookingDetails] API response:', { 
        id: resp?._id, 
        status: resp?.status, 
        ceremonyType: resp?.ceremonyType,
        hasCeremonyDetails: !!resp?.ceremonyDetails,
        ceremonyName: resp?.ceremonyDetails?.name,
        hasLocation: !!resp?.location,
        address: resp?.location?.address,
        date: resp?.date
      });
      return resp;
    },
    enabled: !!queryBookingId,
    // Refetch every 10 seconds if booking is active (not terminal)
    refetchInterval: (query: any) => {
      const status = query?.state?.data?.status || booking?.status;
      return (status && !['completed', 'cancelled'].includes(status)) ? 10000 : false;
    }
  });

  // Log errors
  useEffect(() => {
    if (fetchError) {
      console.error('[BookingDetails] Fetch error:', fetchError);
    }
  }, [fetchError]);

  // Refetch when screen focused
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 3. Update state when fetched
  useEffect(() => {
    if (fetchedBooking) {
      console.log('[BookingDetails] Updating booking state from API response');
      setBooking(fetchedBooking);
    }
  }, [fetchedBooking]);

  const loading = isFetching && !booking;

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!booking?.date) return;
    
    const update = () => {
      const now = new Date().getTime();
      
      // Combine date and startTime for accurate target
      const target = new Date(booking.date);
      if (booking.startTime) {
        const [hours, minutes] = booking.startTime.split(':').map(Number);
        target.setHours(hours, minutes, 0, 0);
      } else {
        target.setHours(0, 0, 0, 0);
      }
      
      const diff = target.getTime() - now;
      if (diff <= 0) { 
        setCountdown(null); 
        return; 
      }
      
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
    const id = setInterval(update, 60000); // Update every minute
    return () => clearInterval(id);
  }, [booking?.date, booking?.startTime]);

  // Schedule local reminder for confirmed bookings
  useEffect(() => {
    if (booking?.status === "confirmed" && booking?.date && booking?.startTime) {
      schedulePujaReminder(
        booking._id || booking.id,
        booking.ceremonyDetails?.name || booking.ceremonyType || "Puja",
        booking.date,
        booking.startTime,
        120 // 2 hours before
      );
    }
  }, [booking?.status, booking?._id, booking?.date, booking?.startTime]);

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
    if (booking.status === "requested") {
      subMessage = "Cancellation policy: Since the priest hasn't accepted yet, you will receive a full refund.";
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
              await devoteeService.cancelBooking(booking._id || booking.id, { reason: "Cancelled by devotee" });
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
    const phone = booking?.priestId?.phone || (typeof booking?.priestId === 'object' ? booking?.priestId?.userId?.phone : null);
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Error", "Priest's phone number not available.");
    }
  };

  const handleMessagePriest = () => {
    const phone = booking?.priestId?.phone || (typeof booking?.priestId === 'object' ? booking?.priestId?.userId?.phone : null);
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    } else {
      Alert.alert("Error", "Priest's phone number not available.");
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

  // If we have a fetch error and no valid local booking data, show error
  if (fetchError && !booking?.ceremonyType) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={APP_COLORS.error} />
        <Text style={styles.errorText}>
          {typeof fetchError === 'string' ? fetchError : "Booking not found or has been deleted."}
        </Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Current booking logic
  const currentBooking = fetchedBooking || booking;

  // Show loading if fetching and we don't have basic local data
  if (isFetching && !currentBooking?.ceremonyType) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!currentBooking || (!currentBooking.ceremonyType && !currentBooking.ceremonyDetails)) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={60} color={APP_COLORS.gray} />
        <Text style={styles.errorText}>Booking details not available.</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#E8630A", "#C4501A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => router.push("/devotee/BookingsTab")}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

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
            {(booking?.ceremonyDetails?.image || booking?.ceremonyType) && (
              <Image
                source={{ 
                  uri: getImageUri(booking.ceremonyDetails?.image) 
                }}
                style={styles.ceremonyImage}
              />
            )}
            <View style={styles.ceremonyInfo}>
              <Text style={styles.ceremonyName}>
                {booking?.ceremonyDetails?.name || booking?.ceremonyType || "-"}
              </Text>
              <Text style={styles.ceremonyType}>
                {booking?.ceremonyDetails?.category || "Ceremony"}
              </Text>
              {booking?.ceremonyDetails?.duration && (
                <Text style={styles.ceremonyDuration}>
                  Duration: {booking.ceremonyDetails?.duration?.typical || 60} min
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Samagri (Materials) List */}
        {booking?.ceremonyDetails?.materials && booking.ceremonyDetails.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="leaf-outline" size={18} color={APP_COLORS.primary} /> Samagri (Materials Required)
            </Text>
            <View style={styles.samagriCard}>
              {booking.ceremonyDetails.materials.map((item: any, index: number) => (
                <View key={index} style={styles.samagriItem}>
                  <View style={styles.samagriDot} />
                  <View style={styles.samagriContent}>
                    <Text style={styles.samagriName}>
                      {item.name}
                      {item.isOptional && <Text style={styles.optionalBadge}> (Optional)</Text>}
                    </Text>
                    <Text style={styles.samagriMeta}>
                      Qty: {item.quantity}
                      {item.providedBy ? ` · By ${item.providedBy}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ritual Steps */}
        {booking?.ceremonyDetails?.ritualSteps && booking.ceremonyDetails.ritualSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list-outline" size={18} color={APP_COLORS.primary} /> Ritual Steps
            </Text>
            <View style={styles.stepsCard}>
              {booking.ceremonyDetails.ritualSteps
                .sort((a: any, b: any) => (a.stepNumber || 0) - (b.stepNumber || 0))
                .map((step: any, index: number) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNum}>{step.stepNumber || index + 1}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                      {step.durationEstimate && (
                        <Text style={styles.stepDur}>~{step.durationEstimate} min</Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Special Instructions */}
        {booking?.ceremonyDetails?.specialInstructions && booking.ceremonyDetails.specialInstructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle-outline" size={18} color={APP_COLORS.warning} /> Special Instructions
            </Text>
            <View style={styles.instructionsCard}>
              {booking.ceremonyDetails.specialInstructions.map((instr: string, index: number) => (
                <View key={index} style={styles.instrItem}>
                  <Ionicons name="information-circle" size={16} color={APP_COLORS.warning} />
                  <Text style={styles.instrText}>{instr}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
        {booking?.priestId && typeof booking.priestId === 'object' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priest Information</Text>
            <View style={styles.devoteeCard}>
              {booking.priestId.profilePicture || booking.priestId.userId?.profilePicture ? (
                <Image
                  source={{ 
                    uri: getImageUri(booking.priestId.profilePicture || booking.priestId.userId?.profilePicture) 
                  }}
                  style={styles.devoteeImage}
                />
              ) : (
                <View style={[styles.devoteeImage, { backgroundColor: APP_COLORS.lightGray, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={24} color={APP_COLORS.gray} />
                </View>
              )}
              <View style={styles.devoteeInfo}>
                <Text style={styles.devoteeName}>
                  {booking.priestId.name || booking.priestId.userId?.name || "-"}
                </Text>
                <Text style={styles.devoteeEmail}>
                  {booking.priestId.email || booking.priestId.userId?.email || "-"}
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
          {(booking?.status === "requested" ||
            booking?.status === "pending" || 
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
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  bookingId: {
    fontSize: 11,
    color: APP_COLORS.gray,
    fontWeight: "500",
  },
  ceremonyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#E8630A",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  directionsButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  requestsText: {
    fontSize: 15,
    color: "#3D2B1F",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: "#E8630A",
    shadowColor: "#E8630A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "serif",
    letterSpacing: 0.3,
  },
  confirmButton: {
    backgroundColor: APP_COLORS.success,
  },
  cancelButton: {
    backgroundColor: "#C0392B",
  },
  completeButton: {
    backgroundColor: APP_COLORS.info,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF8F2",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 18,
  },
  backIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "serif",
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF8F2",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "serif",
    color: "#704214",
    marginBottom: 8,
  },
  backToBookingsButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  backToBookingsText: {
    color: "#E8630A",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "serif",
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
  // Samagri Styles
  samagriCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  samagriItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  samagriDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },
  samagriContent: {
    flex: 1,
  },
  samagriName: {
    fontSize: 14,
    color: APP_COLORS.black,
    fontWeight: "600",
  },
  optionalBadge: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontStyle: "italic",
    fontWeight: "normal",
  },
  samagriMeta: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
  // Ritual Steps Styles
  stepsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 14,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: APP_COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNum: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: APP_COLORS.black,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: APP_COLORS.gray,
    lineHeight: 18,
  },
  stepDur: {
    fontSize: 12,
    color: APP_COLORS.info,
    fontStyle: "italic",
    marginTop: 2,
  },
  // Special Instructions Styles
  instructionsCard: {
    backgroundColor: APP_COLORS.warning + "10",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.warning,
  },
  instrItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  instrText: {
    fontSize: 14,
    color: APP_COLORS.black,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  noInfoText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontStyle: "italic",
    paddingVertical: 10,
    textAlign: "center",
  },
});
