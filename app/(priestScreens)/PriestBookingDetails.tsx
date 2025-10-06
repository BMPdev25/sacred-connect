import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/Colors";

const BookingDetails = () => {
  const { booking } = {
    booking: {
      id: "1",
      ceremonyType: "Wedding Ceremony",
      clientName: "Sharma Family",
      date: new Date("2024-06-10"),
      startTime: "10:30 AM",
      endTime: "1:30 PM",
      location: {
        address: "123 Main Street, Mumbai",
        city: "Mumbai",
      },
      status: "confirmed",
      basePrice: 8000,
      platformFee: 500,
      totalAmount: 8500,
      paymentStatus: "Completed",
      paymentMethod: "upi",
    },
  };

  const [currentStatus, setCurrentStatus] = useState(
    booking.status || "confirmed"
  );

  const bookingDate = new Date(booking.date);
  const formattedDate = bookingDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleStatusUpdate = (newStatus: any) => {
    Alert.alert(
      "Update Status",
      `Are you sure you want to mark this booking as ${newStatus}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            // Update status logic would go here
            setCurrentStatus(newStatus);
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.placeholder} />
        </View>

  <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    currentStatus === "confirmed"
                      ? "#e6f7e6"
                      : currentStatus === "completed"
                      ? "#e6f0ff"
                      : currentStatus === "cancelled"
                      ? "#ffe6e6"
                      : "#fff9e6",
                  borderColor:
                    currentStatus === "confirmed"
                      ? APP_COLORS.success
                      : currentStatus === "completed"
                      ? APP_COLORS.info
                      : currentStatus === "cancelled"
                      ? APP_COLORS.error
                      : APP_COLORS.warning,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      currentStatus === "confirmed"
                        ? APP_COLORS.success
                        : currentStatus === "completed"
                        ? APP_COLORS.info
                        : currentStatus === "cancelled"
                        ? APP_COLORS.error
                        : APP_COLORS.warning,
                  },
                ]}
              >
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ceremony Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ceremony Type</Text>
              <Text style={styles.detailValue}>{booking.ceremonyType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {booking.startTime} - {booking.endTime}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Client Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client Name</Text>
              <Text style={styles.detailValue}>{booking.clientName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>+91 98765 43210</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{booking.location.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>City</Text>
              <Text style={styles.detailValue}>{booking.location.city}</Text>
            </View>
            <TouchableOpacity style={styles.mapButton}>
              <Ionicons
                name="map-outline"
                size={16}
                color={APP_COLORS.primary}
              />
              <Text style={styles.mapButtonText}>View on Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Price</Text>
              <Text style={styles.detailValue}>₹{booking.basePrice}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Platform Fee</Text>
              <Text style={styles.detailValue}>
                ₹{booking.platformFee || 500}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={[styles.detailValue, styles.totalAmount]}>
                ₹{booking.totalAmount || 8500}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <Text
                style={[
                  styles.paymentStatus,
                  {
                    color:
                      booking.paymentStatus === "completed"
                        ? APP_COLORS.success
                        : APP_COLORS.warning,
                  },
                ]}
              >
                {booking.paymentStatus === "completed" ? "Paid" : "Pending"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {booking.paymentMethod === "upi"
                  ? "UPI"
                  : booking.paymentMethod === "card"
                  ? "Credit/Debit Card"
                  : "Not specified"}
              </Text>
            </View>
          </View>

          {currentStatus === "confirmed" && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStatusUpdate("completed")}
              >
                <Text style={styles.actionButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleStatusUpdate("cancelled")}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.contactButton}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={APP_COLORS.white}
            />
            <Text style={styles.contactButtonText}>Contact Client</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: "bold",
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  paymentStatus: {
    fontWeight: "bold",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  mapButtonText: {
    marginLeft: 8,
    color: APP_COLORS.primary,
    fontWeight: "bold",
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: APP_COLORS.success,
  },
  cancelButton: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.error,
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: APP_COLORS.error,
    fontWeight: "bold",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  contactButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default BookingDetails;
