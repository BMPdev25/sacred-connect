// src/screens/devotee/BookingConfirmationScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useSelector } from 'react-redux';
import { APP_COLORS } from '../../config';
import { Ionicons } from '@expo/vector-icons';

const BookingConfirmationScreen = ({ navigation, route }) => {
  const { booking } = route.params;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I've booked a ${booking.ceremonyType} ceremony with ${booking.priestName} through Sacred Connect on ${formatDate(booking.date)} at ${booking.startTime}.`,
      });
    } catch (error) {
      console.log('Error sharing:', error.message);
    }
  };

  const handleViewBookings = () => {
    navigation.navigate('DevoteeTabs', { screen: 'Bookings' });
  };

  const handleHome = () => {
        navigation.navigate('DevoteeTabs', { screen: 'Home' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={APP_COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.successText}>
            Your booking has been confirmed and a confirmation has been sent to your email.
          </Text>
        </View>

        <View style={styles.bookingDetailsContainer}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.bookingId}>
            <Text style={styles.bookingIdLabel}>Booking ID:</Text>
            <Text style={styles.bookingIdValue}>{booking.paymentId.replace('PAY', 'BK')}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ceremony Type</Text>
            <Text style={styles.detailValue}>{booking.ceremonyType}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Priest</Text>
            <Text style={styles.detailValue}>{booking.priestName}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{booking.startTime} - {booking.endTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Venue</Text>
            <Text style={styles.detailValue}>{booking.location.address}, {booking.location.city}</Text>
          </View>
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{booking.paymentMethod === 'upi' ? 'UPI' : 'Credit/Debit Card'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment ID</Text>
            <Text style={styles.detailValue}>{booking.paymentId}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Paid</Text>
            </View>
          </View>

          <View style={styles.amountBreakdown}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{booking.ceremonyType} Ceremony</Text>
              <Text style={styles.amountValue}>₹{booking.basePrice}</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Platform Fee</Text>
              <Text style={styles.amountValue}>₹{booking.platformFee}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              The priest will contact you soon to discuss ceremony requirements.
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Prepare the venue and necessary items as advised by the priest.
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              You'll receive a reminder 24 hours before the ceremony.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={APP_COLORS.primary} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewBookingsButton} onPress={handleViewBookings}>
            <Text style={styles.viewBookingsText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.white,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  successContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    textAlign: 'center',
  },
  bookingDetailsContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bookingId: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bookingIdLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  paymentContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.success,
    marginRight: 6,
  },
  statusText: {
    color: APP_COLORS.success,
    fontWeight: 'bold',
  },
  amountBreakdown: {
    backgroundColor: APP_COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: APP_COLORS.lightGray,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  instructionsContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
  },
  actions: {
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  viewBookingsButton: {
    backgroundColor: APP_COLORS.primary + '20',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBookingsText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: APP_COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  homeButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingConfirmationScreen;