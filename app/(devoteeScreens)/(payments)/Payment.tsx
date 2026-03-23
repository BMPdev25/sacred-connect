import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import RazorpayCheckout from "react-native-razorpay";
import { APP_COLORS } from "../../../constants/Colors";
import { getBookings } from "../../../redux/slices/bookingSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import devoteeService from "../../../services/devoteeService";

// Format expiry date as MM/YY
const formatExpiryDate = (text: string) => {
  // Remove all non-digits
  const cleaned = text.replace(/\D/g, '');
  
  // Handle deletion - if user is deleting and cleaned is shorter
  if (cleaned.length === 0) {
    return '';
  }
  
  // Validate month (first 2 digits should be 01-12)
  let month = cleaned.slice(0, 2);
  if (month.length === 1 && parseInt(month) > 1) {
    // If first digit is > 1, prepend with 0 (e.g., 3 becomes 03)
    month = '0' + month;
  } else if (month.length === 2) {
    const monthNum = parseInt(month);
    if (monthNum > 12) {
      month = '12';
    } else if (monthNum === 0) {
      month = '01';
    }
  }
  
  // Format as MM/YY
  if (cleaned.length >= 2) {
    const year = cleaned.slice(2, 4);
    return month + '/' + year;
  }
  
  return month.slice(0, cleaned.length);
};

const Payment: React.FC = () => {
  const params = useLocalSearchParams();
  let bookingDetails: any = null;
  if (params.bookingDetails) {
    try {
      bookingDetails =
        typeof params.bookingDetails === "string"
          ? JSON.parse(params.bookingDetails)
          : params.bookingDetails;
    } catch (e) {
      bookingDetails = null;
    }
  }
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const handlePayment = async () => {
    // Note: We bypass manual UI card validations since Razorpay provides its own checkout UI.
    setIsProcessing(true);

    try {
      // 1. Create booking data for API
      const bookingData = {
        devoteeId: userInfo?._id,
        priestId: bookingDetails.priestId,
        ceremonyType: bookingDetails.ceremonyType,
        date: new Date(bookingDetails.date),
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime,
        location: bookingDetails.location,
        notes: bookingDetails.notes || "",
        basePrice: bookingDetails.basePrice,
        platformFee: bookingDetails.platformFee,
        totalAmount: bookingDetails.totalAmount,
        status: "requested", // Initialize as pending/requested
        paymentStatus: "pending", 
      };

      // 2. Insert booking via API
      let createdBooking: any;
      try {
        const response = await devoteeService.createBooking(bookingData);
        createdBooking = response.data || response;
      } catch (e: any) {
        throw new Error(e?.message || "Failed to create pending booking.");
      }

      const bookingId = createdBooking._id || createdBooking.id;

      // 3. Create Razorpay Order matching this booking
      let orderResponse: any;
      try {
        orderResponse = await devoteeService.createRazorpayOrder(bookingId, bookingDetails.totalAmount);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to generate Razorpay Order from server.");
      }
      
      const orderParams = orderResponse.data || orderResponse;

      // 4. Open Razorpay Checkout Modal
      const options = {
        description: `${bookingDetails.ceremonyType} Booking`,
        image: 'https://i.imgur.com/3g7nmJC.png', // Temporary placeholder logo
        currency: orderParams.currency || 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE', 
        amount: orderParams.amount,
        name: 'Sacred Connect',
        order_id: orderParams.orderId || orderParams.id, 
        prefill: {
          email: userInfo?.email || '',
          contact: userInfo?.phone || '',
          name: userInfo?.name || ''
        },
        theme: { color: APP_COLORS.primary }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // 5. Verify the cryptographic signature post-payment
        try {
          await devoteeService.verifyRazorpayPayment({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            bookingId: bookingId
          });

          // Refresh global booking state
          dispatch(getBookings());
          setIsProcessing(false);

          // Route to Confirmation Screen
          router.push({
            pathname: "/BookingConfirmation",
            params: { 
              bookingId: bookingId,
              priestName: bookingDetails.priestName,
              priestImage: bookingDetails.priestImage,
            },
          });
        } catch (verifyErr: any) {
          throw new Error("Payment verification failed on the server.");
        }
      }).catch((error: any) => {
        setIsProcessing(false);
        // Razorpay modal closed or failed
        const errorMsg = error?.error?.description || "Payment was cancelled or failed.";
        Alert.alert("Payment Issue", errorMsg);
        // Expected behavior: booking remains in "pending" status, user can try again later
      });

    } catch (error: unknown) {
      setIsProcessing(false);
      console.error("Payment/Booking creation error:", error);
      Alert.alert(
        "Booking Failed",
        (error as Error)?.message ||
        "An error occurred while processing your booking. Please try again."
      );
    }
  };
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          <View style={styles.bookingSummaryContainer}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Ceremony</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.ceremonyType || "N/A"}
              </Text>
            </View>
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Priest</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.priestName || "N/A"}
              </Text>
            </View>
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Date</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.date ? formatDate(bookingDetails.date) : "N/A"}
              </Text>
            </View>
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Time</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.startTime || "N/A"} -{" "}
                {bookingDetails.endTime || "N/A"}
              </Text>
            </View>
            <View style={styles.bookingDetail}>
              <Text style={styles.bookingLabel}>Location</Text>
              <Text style={styles.bookingValue}>
                {bookingDetails.location?.address || "N/A"},{" "}
                {bookingDetails.location?.city || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.priceSummaryContainer}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {bookingDetails.ceremonyType || "N/A"} Ceremony
              </Text>
              <Text style={styles.priceValue}>
                ₹{bookingDetails.basePrice || "0"}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>
                ₹{bookingDetails.platformFee || "0"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{bookingDetails.totalAmount || "0"}
              </Text>
            </View>
          </View>

          <View style={styles.paymentMethodContainer}>
            <Text style={styles.sectionTitle}>Secure Payment via Razorpay</Text>
            <Text style={styles.paymentMethodText}>
              Tap the Pay button below to securely open Razorpay Checkout. 
              You can pay via UPI, Credit/Debit Cards, Netbanking, or Wallets.
            </Text>
          </View>

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={APP_COLORS.success}
            />
            <Text style={styles.securityText}>
              Your payment information is securely encrypted. We do not store
              your card details.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalFooterLabel}>Total</Text>
            <Text style={styles.totalFooterValue}>
              ₹{bookingDetails.totalAmount || "0"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={isProcessing}
          >
            <Text style={styles.payButtonText}>
              {isProcessing
                ? "Processing..."
                : `Pay ₹${bookingDetails.totalAmount || "0"}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    alignItems: "center",
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
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  bookingSummaryContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bookingDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bookingLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  bookingValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceSummaryContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: APP_COLORS.lightGray,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  paymentMethodContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  paymentMethodOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: APP_COLORS.primary,
    backgroundColor: APP_COLORS.primary + "10",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.primary,
  },
  paymentMethodText: {
    fontSize: 16,
  },
  paymentIcon: {
    width: 40,
    height: 20,
    resizeMode: "contain",
  },
  cardIcons: {
    flexDirection: "row",
  },
  cardIcon: {
    width: 40,
    height: 25,
    resizeMode: "contain",
    marginLeft: 8,
  },
  upiContainer: {
    marginTop: 16,
  },
  cardContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailHalf: {
    width: "48%",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  securityText: {
    marginLeft: 12,
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  footer: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  totalContainer: {
    flex: 1,
  },
  totalFooterLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  totalFooterValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  payButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  payButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Payment;
