// src/screens/devotee/BookingScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
// react-native-calendars may not include types in this repo; silence TS for the import
// @ts-ignore
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import devoteeService from "../../../services/devoteeService";

const PLATFORM_FEE_PERCENT = 0.05; // 5% fee

const BookCeremony: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const priestId = params.priestId as string;
  const [priest, setPriest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Booking form state
  const [selectedCeremony, setSelectedCeremony] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<any | null>(null);

  // Location State
  const [location, setLocation] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [useManualAddress, setUseManualAddress] = useState<boolean>(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>("");

  // Calendar min date (today)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  // Generate dynamic time slots based on priest's weekly availability
  const getDynamicTimeSlots = () => {
    if (!selectedDate || !priest?.weeklyAvailability) return [];

    // Get day name from date string
    const dateObj = new Date(selectedDate);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dayAvailability = priest.weeklyAvailability[dayName];

    if (!dayAvailability || !dayAvailability.available || !dayAvailability.startTime || !dayAvailability.endTime) {
      return [];
    }

    const slots = [];
    let [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);

    const endTotalMinutes = endHour * 60 + endMin;

    let currentTotalMinutes = startHour * 60 + startMin;
    let slotId = 1;

    while (currentTotalMinutes + 120 <= endTotalMinutes) {
      const sH = Math.floor(currentTotalMinutes / 60);
      const sM = currentTotalMinutes % 60;
      const eH = Math.floor((currentTotalMinutes + 120) / 60);
      const eM = (currentTotalMinutes + 120) % 60;

      const format = (h: number, m: number) =>
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      slots.push({
        id: slotId.toString(),
        startTime: format(sH, sM),
        endTime: format(eH, eM)
      });

      currentTotalMinutes += 120; // 2 hour slots
      slotId++;
    }

    return slots;
  };

  const dynamicTimeSlots = getDynamicTimeSlots();

  useEffect(() => {
    const fetchPriestDetails = async () => {
      setIsLoading(true);
      try {
        const data = await devoteeService.getPriestDetails(priestId);
        setPriest(data);
      } catch (error) {
        console.error("Error fetching priest details:", error);
        Alert.alert(
          "Error",
          "Could not load priest details. Please try again later."
        );
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAddresses = async () => {
      try {
        const addresses = await devoteeService.getAddresses();
        if (addresses && addresses.length > 0) {
          setSavedAddresses(addresses);
          // Auto-select default address if available
          const defaultAddr = addresses.find((a: any) => a.isDefault);
          if (defaultAddr) {
            selectAddress(defaultAddr);
          } else {
            selectAddress(addresses[0]);
          }
        } else {
          setUseManualAddress(true);
        }
      } catch (error) {
        console.warn("Failed to fetch addresses", error);
        setUseManualAddress(true);
      }
    };

    fetchPriestDetails();
    fetchAddresses();
  }, [priestId]);

  const selectAddress = (addr: any) => {
    setSelectedAddressId(addr._id);
    setLocation(`${addr.street}, ${addr.area}${addr.landmark ? ', ' + addr.landmark : ''}`);
    setCity(addr.city);
    setUseManualAddress(false);
    setShowAddressModal(false);
  };

  const handleCeremonySelect = (ceremony: any) => {
    setSelectedCeremony(ceremony);
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (timeSlot: any) => {
    setSelectedTime(timeSlot);
  };

  const handleContinue = () => {
    // Validate form
    if (!selectedCeremony) {
      Alert.alert("Error", "Please select a ceremony type");
      return;
    }
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date for the ceremony");
      return;
    }
    if (!selectedTime) {
      Alert.alert("Error", "Please select a time slot");
      return;
    }
    if (!location) {
      Alert.alert("Error", "Please enter the ceremony location");
      return;
    }
    if (!city) {
      Alert.alert("Error", "Please enter the city");
      return;
    }

    // Lead-time validation: 2 hours minimum
    const now = new Date();
    const minLeadTime = 2 * 60 * 60 * 1000; // 2 hours
    const bookingStartTime = new Date(selectedDate);
    const [h, m] = selectedTime.startTime.split(':').map(Number);
    bookingStartTime.setHours(h, m, 0, 0);

    if (bookingStartTime.getTime() - now.getTime() < minLeadTime) {
      Alert.alert(
        "Invalid Time",
        "Bookings must be made at least 2 hours in advance to allow for priest preparation."
      );
      return;
    }
    // Calculate total amount
    const basePrice = selectedCeremony.price;
    const platformFee = Math.round(basePrice * PLATFORM_FEE_PERCENT);
    const totalAmount = basePrice + platformFee;
    // Create booking object
    const bookingDetails = {
      priestId: priest._id,
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
    console.log("Booking details:", bookingDetails);
    // Navigate to payment screen using expo-router
    router.push({
      pathname: "/Payment",
      params: { bookingDetails: JSON.stringify(bookingDetails) },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={{ marginTop: 10 }}>Loading details...</Text>
      </View>
    );
  }

  if (!priest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Could not load priest details. Please try again later.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.continueButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Generate marked dates for calendar
  const markedDates: Record<string, any> = {};
  if (selectedDate) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: APP_COLORS.primary,
    };
  }

  // Use priest.weeklyAvailability to disable dates
  const disabledDates: Record<string, any> = {};
  if (priest.weeklyAvailability) {
    let currentDate = new Date(today);
    for (let i = 0; i < 90; i++) { // Check next 90 days
      const dateString = currentDate.toISOString().split("T")[0];
      const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const dayConfig = priest.weeklyAvailability[dayName];

      if (!dayConfig || !dayConfig.available) {
        disabledDates[dateString] = { disabled: true, disableTouchEvent: true };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Merge marked and disabled dates
  const calendarMarkedDates = { ...disabledDates, ...markedDates };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
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
              {(priest.ceremonies || []).map((ceremony: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.ceremonyCard,
                    selectedCeremony?.name === ceremony.name &&
                    styles.selectedCeremonyCard,
                  ]}
                  onPress={() =>
                    handleCeremonySelect(ceremony)
                  }
                >
                  <Text
                    style={[
                      styles.ceremonyName,
                      selectedCeremony?.name === ceremony.name &&
                      styles.selectedCeremonyName,
                    ]}
                  >
                    {ceremony.name}
                  </Text>
                  <Text
                    style={[
                      styles.ceremonyPrice,
                      selectedCeremony?.name === ceremony.name &&
                      styles.selectedCeremonyPrice,
                    ]}
                  >
                    ₹{ceremony.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Date</Text>
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
              {dynamicTimeSlots.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlotsContainer}
                >
                  {dynamicTimeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlotCard,
                        selectedTime?.id === slot.id &&
                        styles.selectedTimeSlotCard,
                      ]}
                      onPress={() => handleTimeSelect(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime?.id === slot.id &&
                          styles.selectedTimeSlotText,
                        ]}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: APP_COLORS.error, fontStyle: 'italic' }}>
                  No available slots for this date. Please try another day.
                </Text>
              )}
            </View>
          )}

          <View style={styles.formSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Ceremony Location</Text>
              {savedAddresses.length > 0 && (
                <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                  <Text style={{ color: APP_COLORS.primary, fontWeight: 'bold' }}>Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {(savedAddresses.length > 0 && !useManualAddress) ? (
              <TouchableOpacity
                style={styles.addressSelector}
                onPress={() => setShowAddressModal(true)}
              >
                <Ionicons name="location" size={24} color={APP_COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{location.split(',')[0]}...</Text>
                  <Text style={{ color: APP_COLORS.gray, fontSize: 12 }} numberOfLines={1}>{location}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={APP_COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Enter full address"
                    placeholderTextColor={APP_COLORS.gray}
                    value={location}
                    onChangeText={(text) => setLocation(text.slice(0, 100))}
                    multiline
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter city"
                    placeholderTextColor={APP_COLORS.gray}
                    value={city}
                    onChangeText={(text) => setCity(text.slice(0, 50))}
                  />
                </View>
              </>
            )}

            {savedAddresses.length > 0 && (
              <TouchableOpacity
                style={{ marginTop: 8, alignSelf: 'flex-end' }}
                onPress={() => {
                  setUseManualAddress(!useManualAddress);
                  if (!useManualAddress) {
                    setLocation(''); // Clear if switching to manual
                    setCity('');
                  }
                }}
              >
                <Text style={{ color: APP_COLORS.gray, fontSize: 12, textDecorationLine: 'underline' }}>
                  {useManualAddress ? "Select from saved addresses" : "Enter manually instead"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any specific requirements or information the priest should know"
              placeholderTextColor={APP_COLORS.gray}
              value={notes}
              onChangeText={(text) => setNotes(text.slice(0, 500))}
              multiline
              numberOfLines={4}
            />
          </View>

          {selectedCeremony && (
            <View style={styles.priceSummaryContainer}>
              <Text style={styles.sectionTitle}>Price Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {selectedCeremony.name} Ceremony
                </Text>
                <Text style={styles.priceValue}>₹{selectedCeremony.price}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Platform Fee ({PLATFORM_FEE_PERCENT * 100}%)</Text>
                <Text style={styles.priceValue}>
                  ₹{Math.round(selectedCeremony.price * PLATFORM_FEE_PERCENT)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₹
                  {selectedCeremony.price +
                    Math.round(selectedCeremony.price * PLATFORM_FEE_PERCENT)}
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

        {/* Address Selection Modal */}
        <Modal
          visible={showAddressModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddressModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Address</Text>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <Ionicons name="close" size={24} color={APP_COLORS.black} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {savedAddresses.map((addr) => (
                  <TouchableOpacity
                    key={addr._id}
                    style={[
                      styles.addressOption,
                      selectedAddressId === addr._id && styles.selectedAddressOption
                    ]}
                    onPress={() => selectAddress(addr)}
                  >
                    <Ionicons
                      name={selectedAddressId === addr._id ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={APP_COLORS.primary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.addressLabel}>{addr.type || 'Home'}</Text>
                        {addr.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText}>
                        {addr.street}, {addr.area}, {addr.city}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addNewAddressButton}
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push('/(devoteeScreens)/profile/AddEditAddress');
                  }}
                >
                  <Ionicons name="add" size={20} color={APP_COLORS.primary} />
                  <Text style={{ color: APP_COLORS.primary, fontWeight: 'bold', marginLeft: 5 }}>Add New Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  priestInfoContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  priestName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
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
    alignItems: "center",
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  selectedCeremonyCard: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  ceremonyName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  selectedCeremonyName: {
    color: APP_COLORS.white,
  },
  ceremonyPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  selectedCeremonyPrice: {
    color: APP_COLORS.white,
  },
  calendar: {
    borderRadius: 10,
    overflow: "hidden",
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
    fontWeight: "500",
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
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: APP_COLORS.black,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  // Address Selector Styles
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary + '10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  selectedAddressOption: {
    backgroundColor: APP_COLORS.primary + '05',
  },
  addressLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  addressText: {
    color: APP_COLORS.gray,
    fontSize: 12,
  },
  defaultBadge: {
    backgroundColor: APP_COLORS.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: APP_COLORS.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray
  }
});

export default BookCeremony;
