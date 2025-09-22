// Moved from BookingScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// @ts-ignore
import { APP_COLORS } from '../../../constants/Colors';
import devoteeService from '../../../services/devoteeService';

type BookingRouteProp = RouteProp<Record<string, object | undefined>, string> & {
  params: { priestId: string };
};

const BookingScreen: React.FC<{ navigation: any; route: BookingRouteProp }> = ({ navigation, route }) => {
  const { priestId } = route.params;
  const [priest, setPriest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedCeremony, setSelectedCeremony] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<any | null>(null);
  const [location, setLocation] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const timeSlots = [
    { id: '1', startTime: '08:00', endTime: '10:00' },
    { id: '2', startTime: '10:30', endTime: '12:30' },
    { id: '3', startTime: '13:00', endTime: '15:00' },
    { id: '4', startTime: '15:30', endTime: '17:30' },
    { id: '5', startTime: '18:00', endTime: '20:00' },
  ];

  useEffect(() => {
    const fetchPriestDetails = async () => {
      setIsLoading(true);
      try {
        const data = await devoteeService.getPriestDetails(priestId);
        setPriest(data);
      } catch (error) {
        console.error('Error fetching priest details:', error);
        Alert.alert('Error', 'Could not load priest details. Please try again later.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchPriestDetails();
  }, [priestId]);

  const handleCeremonySelect = (ceremony: any) => {
    setSelectedCeremony(ceremony);
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null);
  };

  const handleTimeSelect = (timeSlot: any) => {
    setSelectedTime(timeSlot);
  };

  const handleContinue = () => {
    if (!selectedCeremony) {
      Alert.alert('Error', 'Please select a ceremony type');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date for the ceremony');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Please enter the ceremony location');
      return;
    }
    if (!city) {
      Alert.alert('Error', 'Please enter the city');
      return;
    }

    const basePrice = selectedCeremony.price;
    const platformFee = Math.round(basePrice * 0.05);
    const totalAmount = basePrice + platformFee;

    const bookingDetails = {
      priestId: priest._id || priest.id,
      priestName: priest.name,
      priestImage: priest.profilePicture,
      ceremonyType: selectedCeremony.name,
      date: selectedDate,
      startTime: selectedTime.startTime,
      endTime: selectedTime.endTime,
      location: {
        address: location,
        city: city,
      },
      requirements: notes,
      basePrice: basePrice,
      platformFee: platformFee,
      totalAmount: totalAmount,
    };

    navigation.navigate('Payment', { bookingDetails });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading priest details...</Text>
      </View>
    );
  }

  const markedDates: Record<string, any> = {};
  if (selectedDate) {
    markedDates[selectedDate] = { selected: true, selectedColor: APP_COLORS.primary };
  }

  const disabledDates: Record<string, any> = {};
  let currentDate = new Date(today);
  for (let i = 0; i < 60; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    if (currentDate.getDay() === 0) {
      disabledDates[dateString] = { disabled: true, disableTouchEvent: true };
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const calendarMarkedDates = { ...disabledDates, ...markedDates };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Ceremony</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* ...existing content... */}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color={APP_COLORS.white} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: APP_COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
    backgroundColor: APP_COLORS.white,
  },
  continueButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default BookingScreen;
