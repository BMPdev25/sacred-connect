// Moved from BookingDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { APP_COLORS } from '../../../constants/Colors';


const BookingDetailsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bookingData = route.params?.booking || null;

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

  const handleGetDirections = () => {
    if (booking?.location?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address)}`;
      Linking.openURL(url);
    }
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
      {/* <ExpoStatusBar style="light" backgroundColor={APP_COLORS.primary} /> */}

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ceremony Details</Text>
        </View>

        <TouchableOpacity
          style={styles.backToBookingsButton}
          onPress={() => navigation.navigate('..')}
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToBookingsButton: {
    padding: 12,
    alignItems: 'center',
  },
  backToBookingsText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
  },
});

export default BookingDetailsScreen;
