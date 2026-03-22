import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../../constants/Colors';
import devoteeService from '../../../services/devoteeService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import { useEffect, useState } from 'react';

const BookingConfirmation: React.FC = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await devoteeService.getBookingDetails(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'TBD';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I've booked a ${booking.ceremonyType} ceremony with ${booking.priestName} through Sacred Connect on ${formatDate(booking.date)} at ${booking.startTime}.`,
      });
    } catch (error: unknown) {
      // error may be unknown; stringify safely
      console.log('Error sharing:', (error as any)?.message ?? String(error));
    }
  };

  const handleViewBookings = () => {
    router.push('/devotee/BookingsTab')
    // navigation.navigate('DevoteeTabs', { screen: 'Bookings' });
  };

  const handleHome = () => {
        router.push('/devotee/HomeTab')
        // navigation.navigate('DevoteeTabs', { screen: 'Home' });
  };

  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <LoadingSpinner text="Retrieving your booking details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ErrorMessage 
            message="We couldn't retrieve your booking details." 
            showRetry 
            onRetry={fetchBooking} 
          />
          <TouchableOpacity style={[styles.homeButton, { marginTop: 24, width: '80%' }]} onPress={handleHome}>
            <Text style={styles.homeButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={APP_COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.successText}>
            Your booking has been confirmed. You will receive updates as the priest accepts your request.
          </Text>
        </View>

        <View style={styles.bookingDetailsContainer}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.bookingId}>
            <Text style={styles.bookingIdLabel}>Booking ID:</Text>
            <Text style={styles.bookingIdValue}>{booking.bookingId || booking._id?.substring(0,8).toUpperCase() || 'N/A'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ceremony Type</Text>
            <Text style={styles.detailValue}>{booking.ceremonyType || 'N/A'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Priest</Text>
            <Text style={styles.detailValue}>{booking.priestId?.name || params.priestName || 'Assigned Priest'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{(booking.startTime || 'TBD')} - {(booking.endTime || 'TBD')}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Venue</Text>
            <Text style={styles.detailValue}>{booking.location?.address || 'TBD'}, {booking.location?.city || ''}</Text>
          </View>
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{booking.paymentMethod?.toUpperCase() || 'N/A'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment ID</Text>
            <Text style={styles.detailValue}>{booking.paymentId || 'N/A'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: booking.paymentStatus === 'completed' ? APP_COLORS.success : APP_COLORS.warning }]} />
              <Text style={[styles.statusText, { color: booking.paymentStatus === 'completed' ? APP_COLORS.success : APP_COLORS.warning }]}>
                {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.amountBreakdown}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{booking.ceremonyType} Ceremony</Text>
              <Text style={styles.amountValue}>₹{booking.basePrice || 0}</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Platform Fee</Text>
              <Text style={styles.amountValue}>₹{booking.platformFee || 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{booking.totalAmount || 0}</Text>
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
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
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }
});

export default BookingConfirmation;