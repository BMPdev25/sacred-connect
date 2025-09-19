// src/screens/priest/BookingDetailsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_COLORS } from '../../constants/Colors';
import { formatCurrency } from '../../utils/formatUtlis';


const BookingDetailsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get booking data from route params or fetch from API
  useEffect(() => {
    const bookingData = route.params?.booking || {
      id: 'BK001',
      devotee: {
        name: 'Raj Patel',
        phone: '+91 9876543210',
        email: 'raj.patel@example.com',
        image: require('../../assets/default-profile.png'),
      },
      ceremony: {
        type: 'Wedding Ceremony',
        name: 'Hindu Wedding',
        duration: '3-4 hours',
        image: require('../../assets/wedding.jpg'),
      },
      date: '2024-02-15',
      time: '10:00 AM',
      location: {
        address: '123 Main Street, Mumbai, Maharashtra 400001',
        landmark: 'Near City Mall',
      },
      amount: 15000,
      advance: 5000,
      remaining: 10000,
      status: 'confirmed', // confirmed, pending, completed, cancelled
      paymentStatus: 'partial', // paid, partial, pending
      specialRequests: 'Please bring flowers for decoration. Need vegetarian prasad only.',
      createdAt: '2024-01-20',
    };

    setBooking(bookingData);
    setLoading(false);
  }, [route.params]);

  const handleCallDevotee = () => {
    const phone = booking?.devotee?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleMessageDevotee = () => {
    const phone = booking?.devotee?.phone;
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    Alert.alert(
      'Update Booking Status',
      `Are you sure you want to mark this booking as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
            onPress: () => {
            setBooking((prev: any) => ({ ...prev, status: newStatus }));
            // Here you would make an API call to update the status
            Alert.alert('Success', `Booking status updated to ${newStatus}`);
          },
        },
      ]
    );
  };

  const handleGetDirections = () => {
    if (booking?.location?.address) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address)}`;
  Linking.openURL(url);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return APP_COLORS.success;
      case 'pending':
        return APP_COLORS.warning;
      case 'completed':
        return APP_COLORS.info;
      case 'cancelled':
        return APP_COLORS.error;
      default:
        return APP_COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor={APP_COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
          </View>
          <Text style={styles.bookingId}>Booking ID: {booking.id}</Text>
        </View>

        {/* Ceremony Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ceremony Details</Text>
          <View style={styles.ceremonyCard}>
            <Image source={booking.ceremony.image} style={styles.ceremonyImage} />
            <View style={styles.ceremonyInfo}>
              <Text style={styles.ceremonyName}>{booking.ceremony.name}</Text>
              <Text style={styles.ceremonyType}>{booking.ceremony.type}</Text>
              <Text style={styles.ceremonyDuration}>Duration: {booking.ceremony.duration}</Text>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={20} color={APP_COLORS.primary} />
              <Text style={styles.scheduleText}>{formatDate(booking.date)}</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={20} color={APP_COLORS.primary} />
              <Text style={styles.scheduleText}>{booking.time}</Text>
            </View>
          </View>
        </View>

        {/* Devotee Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devotee Information</Text>
          <View style={styles.devoteeCard}>
            <Image source={booking.devotee.image} style={styles.devoteeImage} />
            <View style={styles.devoteeInfo}>
              <Text style={styles.devoteeName}>{booking.devotee.name}</Text>
              <Text style={styles.devoteeEmail}>{booking.devotee.email}</Text>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleCallDevotee}
              >
                <Ionicons name="call" size={18} color={APP_COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleMessageDevotee}
              >
                <Ionicons name="chatbubble" size={18} color={APP_COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color={APP_COLORS.primary} />
              <View style={styles.locationText}>
                <Text style={styles.address}>{booking.location.address}</Text>
                {booking.location.landmark && (
                  <Text style={styles.landmark}>Landmark: {booking.location.landmark}</Text>
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
              <Text style={styles.paymentAmount}>{formatCurrency(booking.amount)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Advance Paid:</Text>
              <Text style={styles.paymentAdvance}>{formatCurrency(booking.advance)}</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <Text style={styles.paymentLabel}>Remaining:</Text>
              <Text style={styles.paymentRemaining}>{formatCurrency(booking.remaining)}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentStatusLabel}>Payment Status: </Text>
              <Text style={[
                styles.paymentStatusText,
                { color: booking.paymentStatus === 'paid' ? APP_COLORS.success : APP_COLORS.warning }
              ]}>
                {booking.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Requests */}
        {booking.specialRequests && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <View style={styles.requestsCard}>
              <Text style={styles.requestsText}>{booking.specialRequests}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleUpdateStatus('confirmed')}
              >
                <Text style={styles.actionButtonText}>Confirm Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleUpdateStatus('cancelled')}
              >
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </>
          )}

          {booking.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleUpdateStatus('completed')}
            >
              <Text style={styles.actionButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back to Bookings Button */}
        <TouchableOpacity
          style={styles.backToBookingsButton}
          onPress={() => navigation.navigate('PriestTabs', { screen: 'Bookings' })}
        >
          <Text style={styles.backToBookingsText}>Back to All Bookings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: APP_COLORS.error,
    marginBottom: 20,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingId: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 10,
  },
  ceremonyCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ceremonyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  ceremonyInfo: {
    flex: 1,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 5,
  },
  ceremonyType: {
    fontSize: 14,
    color: APP_COLORS.primary,
    marginBottom: 5,
  },
  ceremonyDuration: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  scheduleCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleText: {
    fontSize: 16,
    color: APP_COLORS.black,
    marginLeft: 10,
  },
  devoteeCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devoteeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  devoteeInfo: {
    flex: 1,
  },
  devoteeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 5,
  },
  devoteeEmail: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  contactButtons: {
    flexDirection: 'row',
  },
  contactButton: {
    backgroundColor: APP_COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  locationCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
  },
  address: {
    fontSize: 14,
    color: APP_COLORS.black,
    lineHeight: 20,
  },
  landmark: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 5,
  },
  directionsButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionsButtonText: {
    color: APP_COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
    paddingTop: 10,
    marginTop: 5,
  },
  paymentLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.black,
  },
  paymentAdvance: {
    fontSize: 14,
    color: APP_COLORS.success,
    fontWeight: '600',
  },
  paymentRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.error,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  paymentStatusLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestsCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestsText: {
    fontSize: 14,
    color: APP_COLORS.black,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 10,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: APP_COLORS.success,
  },
  cancelButton: {
    backgroundColor: APP_COLORS.error,
  },
  completeButton: {
    backgroundColor: APP_COLORS.primary,
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToBookingsButton: {
    backgroundColor: APP_COLORS.lightGray,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  backToBookingsText: {
    color: APP_COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingDetailsScreen;