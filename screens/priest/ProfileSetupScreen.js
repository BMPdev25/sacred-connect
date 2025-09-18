// Complete updated ProfileSetupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile as updateUserProfile } from '../../redux/slices/authSlice';
import { updateProfile } from '../../redux/slices/priestSlice';
import { APP_COLORS } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUser } from '../../redux/slices/authSlice';

const ProfileSetupScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  // Get existing profile data from route params
  const existingProfile = route?.params?.profileData;
  const isEditing = route?.params?.isEditing;

  // Form state - pre-fill if editing
  const [name, setName] = useState(userInfo?.name || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [experience, setExperience] = useState(existingProfile?.experience?.toString() || '');
  const [religiousTradition, setReligiousTradition] = useState(existingProfile?.religiousTradition || '');
  const [description, setDescription] = useState(existingProfile?.description || '');
  const [templesAffiliated, setTemplesAffiliated] = useState(
    existingProfile?.templesAffiliated && existingProfile.templesAffiliated.length > 0
      ? existingProfile.templesAffiliated
      : [{ name: '', address: '' }]
  );

  // Services/ceremonies offered
  const [availableCeremonies, setAvailableCeremonies] = useState([
    { id: '1', name: 'Wedding Ceremony', selected: false, price: '15000' },
    { id: '2', name: 'Grih Pravesh', selected: false, price: '8000' },
    { id: '3', name: 'Baby Naming', selected: false, price: '5000' },
    { id: '4', name: 'Satyanarayan Katha', selected: false, price: '11000' },
    { id: '5', name: 'Funeral Ceremony', selected: false, price: '12000' },
  ]);

  // Availability
  const [availability, setAvailability] = useState({
    monday: { available: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { available: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { available: true, startTime: '09:00', endTime: '18:00' },
    thursday: { available: true, startTime: '09:00', endTime: '18:00' },
    friday: { available: true, startTime: '09:00', endTime: '18:00' },
    saturday: { available: true, startTime: '09:00', endTime: '18:00' },
    sunday: { available: false, startTime: '09:00', endTime: '18:00' },
  });

  // Form step
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill data when editing
  useEffect(() => {
    if (isEditing && existingProfile) {
      // Pre-fill ceremonies and prices
      if (existingProfile.ceremonies && existingProfile.priceList) {
        const updatedCeremonies = availableCeremonies.map(ceremony => {
          const isSelected = existingProfile.ceremonies.includes(ceremony.name);
          const price = existingProfile.priceList[ceremony.name] || ceremony.price;
          return {
            ...ceremony,
            selected: isSelected,
            price: price.toString()
          };
        });
        setAvailableCeremonies(updatedCeremonies);
      }

      // Pre-fill availability if exists
      if (existingProfile.availability) {
        setAvailability(existingProfile.availability);
      }
    }
  }, [isEditing, existingProfile]);

  // Temple handlers
  const addTemple = () => {
    setTemplesAffiliated([...templesAffiliated, { name: '', address: '' }]);
  };

  const removeTemple = (index) => {
    if (templesAffiliated.length > 1) {
      const updatedTemples = [...templesAffiliated];
      updatedTemples.splice(index, 1);
      setTemplesAffiliated(updatedTemples);
    }
  };

  const updateTemple = (index, field, value) => {
    const updatedTemples = [...templesAffiliated];
    updatedTemples[index][field] = value;
    setTemplesAffiliated(updatedTemples);
  };

  // Ceremony handlers
  const toggleCeremony = (id) => {
    const updatedCeremonies = availableCeremonies.map(ceremony =>
      ceremony.id === id ? { ...ceremony, selected: !ceremony.selected } : ceremony
    );
    setAvailableCeremonies(updatedCeremonies);
  };

  const updateCeremonyPrice = (id, price) => {
    const updatedCeremonies = availableCeremonies.map(ceremony =>
      ceremony.id === id ? { ...ceremony, price } : ceremony
    );
    setAvailableCeremonies(updatedCeremonies);
  };

  // Availability handlers
  const toggleDayAvailability = (day) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        available: !availability[day].available
      }
    });
  };

  const updateTimeSlot = (day, field, value) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        [field]: value
      }
    });
  };

  // Form submission
  const handleSubmit = async () => {
    // Validate form
    if (!name || !email || !phone || !experience || !religiousTradition) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    // Get selected ceremonies
    const selectedCeremonies = availableCeremonies
      .filter(ceremony => ceremony.selected)
      .map(ceremony => ceremony.name);

    if (selectedCeremonies.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one ceremony');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare profile data
      const profileData = {
        experience: parseInt(experience, 10),
        religiousTradition,
        description,
        templesAffiliated: templesAffiliated.filter(temple => temple.name && temple.address),
        ceremonies: selectedCeremonies,
        availability,
        priceList: availableCeremonies
          .filter(ceremony => ceremony.selected)
          .reduce((obj, ceremony) => {
            obj[ceremony.name] = parseInt(ceremony.price, 10);
            return obj;
          }, {}),
      };

      console.log('Updating profile with data:', profileData);
      console.log('Temples affiliated being sent:', profileData.templesAffiliated);
      console.log('Ceremonies being sent:', profileData.ceremonies);

      // Call Redux action to update profile
      await dispatch(updateProfile(profileData));
      console.log('Profile updated successfully via Redux');

      // Also update user info (name, email, phone) via Redux if changed
      const userUpdateData = {};
      if (name !== userInfo?.name) userUpdateData.name = name;
      if (email !== userInfo?.email) userUpdateData.email = email;
      if (phone !== userInfo?.phone) userUpdateData.phone = phone;
      
      if (Object.keys(userUpdateData).length > 0) {
        dispatch(updateUserProfile({
          ...userInfo,
          ...userUpdateData,
          profileCompleted: true
        }));
      }

      // Update AsyncStorage to persist user info changes
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString);
        await AsyncStorage.setItem('userInfo', JSON.stringify({
          ...parsedUserInfo,
          ...userUpdateData,
          profileCompleted: true
        }));
      }

      // Show success message and navigate back
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('Profile updated successfully, navigating back');
              // Navigate back to profile screen with refresh parameter
              navigation.goBack();
              // Force a refresh of the profile screen
              setTimeout(() => {
                navigation.setParams({ refresh: true });
              }, 100);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Update Failed',
        'Failed to update your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep === 1) {
      if (!name || !email || !phone || !experience || !religiousTradition) {
        Alert.alert('Validation Error', 'Please fill all required fields');
        return;
      }
    } else if (currentStep === 2) {
      const selectedCeremonies = availableCeremonies.filter(ceremony => ceremony.selected);
      if (selectedCeremonies.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one ceremony');
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render form steps
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          placeholder="Enter years of experience"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Religious Tradition *</Text>
        <TextInput
          style={styles.input}
          value={religiousTradition}
          onChangeText={setReligiousTradition}
          placeholder="E.g., Hinduism, Buddhism, etc."
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (About Yourself)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your experience, specialties, and services"
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Services & Pricing</Text>
      <Text style={styles.stepSubtitle}>Select the ceremonies you offer and set your pricing</Text>

      {availableCeremonies.map(ceremony => (
        <View key={ceremony.id} style={styles.ceremonyItem}>
          <View style={styles.ceremonyHeader}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  ceremony.selected && styles.checkboxSelected,
                ]}
                onPress={() => toggleCeremony(ceremony.id)}
              >
                {ceremony.selected && (
                  <Ionicons name="checkmark" size={16} color={APP_COLORS.white} />
                )}
              </TouchableOpacity>
              <Text style={styles.ceremonyName}>{ceremony.name}</Text>
            </View>
            {ceremony.selected && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price (₹)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={ceremony.price}
                  onChangeText={(value) => updateCeremonyPrice(ceremony.id, value)}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color={APP_COLORS.primary} />
        <Text style={styles.addButtonText}>Add Custom Ceremony</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Temple Affiliation</Text>
      <Text style={styles.stepSubtitle}>Add temples you are affiliated with</Text>

      {templesAffiliated.map((temple, index) => (
        <View key={index} style={styles.templeItem}>
          <View style={styles.templeHeader}>
            <Text style={styles.templeIndex}>Temple {index + 1}</Text>
            {index > 0 && (
              <TouchableOpacity
                onPress={() => removeTemple(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={20} color={APP_COLORS.error} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temple Name</Text>
            <TextInput
              style={styles.input}
              value={temple.name}
              onChangeText={(value) => updateTemple(index, 'name', value)}
              placeholder="Enter temple name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temple Address</Text>
            <TextInput
              style={styles.input}
              value={temple.address}
              onChangeText={(value) => updateTemple(index, 'address', value)}
              placeholder="Enter temple address"
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addTemple}>
        <Ionicons name="add-circle-outline" size={20} color={APP_COLORS.primary} />
        <Text style={styles.addButtonText}>Add Another Temple</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Availability</Text>
      <Text style={styles.stepSubtitle}>Set your weekly availability</Text>

      {Object.entries(availability).map(([day, data]) => (
        <View key={day} style={styles.availabilityItem}>
          <View style={styles.availabilityDay}>
            <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <Switch
              value={data.available}
              onValueChange={() => toggleDayAvailability(day)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '80' }}
              thumbColor={data.available ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>

          {data.available && (
            <View style={styles.timeSlots}>
              <View style={styles.timeSlot}>
                <Text style={styles.timeLabel}>From</Text>
                <TextInput
                  style={styles.timeInput}
                  value={data.startTime}
                  onChangeText={(value) => updateTimeSlot(day, 'startTime', value)}
                  placeholder="09:00"
                />
              </View>
              <View style={styles.timeSlot}>
                <Text style={styles.timeLabel}>To</Text>
                <TextInput
                  style={styles.timeInput}
                  value={data.endTime}
                  onChangeText={(value) => updateTimeSlot(day, 'endTime', value)}
                  placeholder="18:00"
                />
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
      </View>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              currentStep === step && styles.activeProgressStep,
              currentStep > step && styles.completedProgressStep,
            ]}
          >
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color={APP_COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.progressStepText,
                  currentStep === step && styles.activeProgressStepText,
                ]}
              >
                {step}
              </Text>
            )}
          </View>
        ))}
        <View
          style={[
            styles.progressLine,
            { width: `${(currentStep - 1) * 33.33}%` },
          ]}
        />
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={prevStep}
            disabled={isSubmitting}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.nextButtonText}>
              {isSubmitting ? 'Submitting...' : 'Complete'}
            </Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: APP_COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: APP_COLORS.white,
    position: 'relative',
  },
  progressLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: APP_COLORS.primary,
    left: 40,
    top: '50%',
    marginTop: -1.5,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeProgressStep: {
    backgroundColor: APP_COLORS.primary,
  },
  completedProgressStep: {
    backgroundColor: APP_COLORS.primary,
  },
  progressStepText: {
    color: APP_COLORS.gray,
    fontWeight: 'bold',
  },
  activeProgressStepText: {
    color: APP_COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ceremonyItem: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
  },
  ceremonyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: APP_COLORS.primary,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  priceInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 4,
    padding: 8,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addButtonText: {
    color: APP_COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  templeItem: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    elevation: 1,
  },
  templeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templeIndex: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  availabilityItem: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
  },
  availabilityDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  timeLabel: {
    width: 40,
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  timeInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 4,
    padding: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: APP_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
    marginRight: 8,
  },
  backButtonText: {
    color: APP_COLORS.gray,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: APP_COLORS.primary,
  },
  nextButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
  },
});

export default ProfileSetupScreen;