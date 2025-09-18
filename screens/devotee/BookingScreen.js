// src/screens/devotee/BookingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import { APP_COLORS } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import devoteeService from '../../services/devoteeService';

const BookingScreen = ({ navigation, route }) => {
  const { priestId } = route.params;
  const [priest, setPriest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Booking form state
  const [selectedCeremony, setSelectedCeremony] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Calendar min date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Mock time slots
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

  const handleCeremonySelect = (ceremony) => {
    setSelectedCeremony(ceremony);
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTime(timeSlot);
  };

  const handleContinue = () => {
    // Validate form
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

    // Calculate total amount
    const basePrice = selectedCeremony.price;
    const platformFee = Math.round(basePrice * 0.05); // 5% platform fee
    const totalAmount = basePrice + platformFee;

    // Create booking object
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

    // Navigate to payment screen
    navigation.navigate('Payment', { bookingDetails });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading priest details...</Text>
      </View>
    );
  }

  // Generate marked dates for calendar
  const markedDates = {};
  if (selectedDate) {
    markedDates[selectedDate] = { selected: true, selectedColor: APP_COLORS.primary };
  }

  // Check if day is Sunday (disabled)
  const disabledDates = {};
  let currentDate = new Date(today);
  for (let i = 0; i < 60; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    if (currentDate.getDay() === 0) { // Sunday
      disabledDates[dateString] = { disabled: true, disableTouchEvent: true };
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Merge marked and disabled dates
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
        <View style={styles.priestInfoContainer}>
          <Text style={styles.sectionTitle}>Selected Priest</Text>
          <Text style={styles.priestName}>{priest.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {priest.ratings?.average || 0} ({priest.ratings?.count || 0} reviews)
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Ceremony Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ceremoniesContainer}
          >
            {priest.ceremonies?.map((ceremony, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.ceremonyCard,
                  selectedCeremony?.name === ceremony && styles.selectedCeremonyCard,
                ]}
                onPress={() => handleCeremonySelect({ name: ceremony, price: 5000 })}
              >
                <Text
                  style={[
                    styles.ceremonyName,
                    selectedCeremony?.name === ceremony && styles.selectedCeremonyName,
                  ]}
                >
                  {ceremony}
                </Text>
                <Text
                  style={[
                    styles.ceremonyPrice,
                    selectedCeremony?.name === ceremony && styles.selectedCeremonyPrice,
                  ]}
                >
                  ₹5000
                </Text>
              </TouchableOpacity>
            )) || []}
          </ScrollView>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Text style={styles.sectionSubtitle}>Priest is not available on Sundays</Text>
          <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: APP_COLORS.white,
              textSectionTitleColor: APP_COLORS.gray,
              selectedDayBackgroundColor: APP_COLORS.primary,
              selectedDayTextColor: APP_COLORS.white,
              todayTextColor: APP_COLORS.primary,
              dayTextColor: APP_COLORS.black,
              textDisabledColor: APP_COLORS.lightGray,
              dotColor: APP_COLORS.primary,
              selectedDotColor: APP_COLORS.white,
              arrowColor: APP_COLORS.primary,
              monthTextColor: APP_COLORS.black,
              indicatorColor: APP_COLORS.primary,
            }}
            minDate={minDate}
            markedDates={calendarMarkedDates}
            onDayPress={handleDateSelect}
          />
        </View>

        {selectedDate && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsContainer}
            >
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotCard,
                    selectedTime?.id === slot.id && styles.selectedTimeSlotCard,
                  ]}
                  onPress={() => handleTimeSelect(slot)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime?.id === slot.id && styles.selectedTimeSlotText,
                    ]}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ceremony Location</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter complete address"
              value={location}
              onChangeText={setLocation}
              multiline
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any specific requirements or information the priest should know"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {selectedCeremony && (
          <View style={styles.priceSummaryContainer}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{selectedCeremony.name} Ceremony</Text>
              <Text style={styles.priceValue}>₹{selectedCeremony.price}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee (5%)</Text>
              <Text style={styles.priceValue}>₹{Math.round(selectedCeremony.price * 0.05)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{selectedCeremony.price + Math.round(selectedCeremony.price * 0.05)}
              </Text>
            </View>
          </View>
        )}
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
  priestInfoContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  priestName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  formSection: {
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
  sectionSubtitle: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 8,
  },
  ceremoniesContainer: {
    paddingVertical: 8,
  },
  ceremonyCard: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  selectedCeremonyCard: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  ceremonyName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedCeremonyName: {
    color: APP_COLORS.white,
  },
  ceremonyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  selectedCeremonyPrice: {
    color: APP_COLORS.white,
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  timeSlotsContainer: {
    paddingVertical: 8,
  },
  timeSlotCard: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  selectedTimeSlotCard: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: APP_COLORS.white,
  },
  inputContainer: {
    marginBottom: 16,
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
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceSummaryContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: APP_COLORS.black,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: APP_COLORS.lightGray,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  footer: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  continueButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default BookingScreen;