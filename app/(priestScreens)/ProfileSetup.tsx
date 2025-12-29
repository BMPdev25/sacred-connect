import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { APP_COLORS } from "../../constants/Colors";
import { updateProfile as updateUserProfile } from "../../redux/slices/authSlice";
import { updateProfile } from "../../redux/slices/priestSlice";
import { getAllCeremonies } from "../../api/ceremonyService";
import priestService from "../../services/priestService"; // Import service
import LanguagePicker from "../../components/LanguagePicker";
import api from "../../api";

const HEADER_TOP_PADDING = Platform.OS === "android" ? 24 : 44;

// Memoized Ceremony Item Component to prevent re-renders
const CeremonyItem = React.memo(({ ceremony, onToggle, onUpdatePrice }: any) => {
  return (
    <View style={styles.ceremonyItem}>
      <View style={styles.ceremonyHeader}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              ceremony.selected && styles.checkboxSelected,
            ]}
            onPress={() => onToggle(ceremony.id)}
          >
            {ceremony.selected && (
              <Ionicons
                name="checkmark"
                size={16}
                color={APP_COLORS.white}
              />
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
              onChangeText={(value) => onUpdatePrice(ceremony.id, value)}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>
    </View>
  );
});

const ProfileSetup = () => {
  const dispatch: any = useDispatch();
  const { userInfo } = useSelector((state: any) => state.auth);
  const params = useLocalSearchParams();

  // Helper functions
  const isValidTimeFormat = (t: string) => /^(([01]\d|2[0-3]):([0-5]\d))$/.test(t);

  const timeToMinutes = (t: string) => {
    if (!isValidTimeFormat(t)) return NaN;
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };

  const validateTimePair = (start: string, end: string) => {
    if (!start && !end) return "";
    if (!isValidTimeFormat(start)) return "Invalid start time";
    if (!isValidTimeFormat(end)) return "Invalid end time";
    if (timeToMinutes(start) >= timeToMinutes(end)) return "Start must be before end";
    return "";
  };

  // Normalize isEditing
  let isEditing = false;
  try {
    const rawIsEditing: any = params?.isEditing;
    if (rawIsEditing === true) {
      isEditing = true;
    } else if (typeof rawIsEditing === "string") {
      isEditing = rawIsEditing === "true";
    } else if (Array.isArray(rawIsEditing) && rawIsEditing.length > 0) {
      isEditing = rawIsEditing[0] === "true";
    }
  } catch (err) {
    isEditing = false;
  }

  // Get section parameter for targeted editing
  const editSection = params?.section as string | undefined;

  // Form state - Initialize with defaults, populate async
  const [name, setName] = useState(userInfo?.name || "");
  const [email, setEmail] = useState(userInfo?.email || "");
  const [phone, setPhone] = useState(userInfo?.phone || "");
  const [experience, setExperience] = useState("");
  const [religiousTradition, setReligiousTradition] = useState("");
  const [description, setDescription] = useState("");
  const [languages, setLanguages] = useState<string[]>(userInfo?.languagesSpoken || []);
  const [templesAffiliated, setTemplesAffiliated] = useState([
    { name: "", address: "" },
  ]);

  const [availableCeremonies, setAvailableCeremonies] = useState<any[]>([]);
  const [isLoadingCeremonies, setIsLoadingCeremonies] = useState(true);

  const [availability, setAvailability] = useState({
    monday: { available: false, startTime: "", endTime: "" },
    tuesday: { available: false, startTime: "", endTime: "" },
    wednesday: { available: false, startTime: "", endTime: "" },
    thursday: { available: false, startTime: "", endTime: "" },
    friday: { available: false, startTime: "", endTime: "" },
    saturday: { available: false, startTime: "", endTime: "" },
    sunday: { available: false, startTime: "", endTime: "" },
  });

  const [defaultStart, setDefaultStart] = useState("09:00");
  const [defaultEnd, setDefaultEnd] = useState("18:00");
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom navigation
  const jumpToStepRaw = params?.jumpToStep;
  const initialStep = jumpToStepRaw ? parseInt(jumpToStepRaw as string, 10) : 1;
  const isSingleSectionMode = !!jumpToStepRaw;

  // Initialize step
  useEffect(() => {
    if (initialStep > 1 && initialStep <= 4) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  // Fetch Logic
  useEffect(() => {
    const fetchAndSetupData = async () => {
      try {
        setIsLoadingCeremonies(true);

        // Parallel fetch of ceremonies and profile (if editing)
        const [ceremoniesRes, profileRes] = await Promise.all([
          getAllCeremonies(),
          isEditing ? priestService.getProfile().catch(err => {
            console.warn("Failed to fetch profile:", err);
            return null;
          }) : Promise.resolve(null)
        ]);

        // If userInfo is null, fetch user data from API
        let userData = userInfo;
        if (!userData && isEditing) {
          try {
            console.log("ProfileSetup - userInfo is null, fetching from API");
            const userResponse = await api.get('/api/users/profile');
            userData = userResponse.data?.data || userResponse.data;
            console.log("ProfileSetup - Fetched user data:", userData);
          } catch (err) {
            console.warn("Failed to fetch user data:", err);
          }
        }

        let ceremoniesFromBackend = [];
        if (Array.isArray(ceremoniesRes)) {
          ceremoniesFromBackend = ceremoniesRes;
        } else if (ceremoniesRes?.ceremonies && Array.isArray(ceremoniesRes.ceremonies)) {
          ceremoniesFromBackend = ceremoniesRes.ceremonies;
        } else if (ceremoniesRes?.data && Array.isArray(ceremoniesRes.data)) {
          ceremoniesFromBackend = ceremoniesRes.data;
        }

        let mappedCeremonies = ceremoniesFromBackend.map((c: any) => ({
          id: c._id,
          name: c.name,
          selected: false,
          price: c.pricing?.basePrice?.toString() || "0",
          duration: c.duration?.typical || 60,
        }));

        // Determine profile source (Prefer Fetch > Params)
        let loadedProfile = profileRes;

        // Fallback: try to parse from params if direct fetch failed
        if (!loadedProfile && params.profileData) {
          try {
            loadedProfile = JSON.parse(params.profileData as string);
          } catch (err) {
            console.warn("Failed to parse profileData from params:", err);
          }
        }

        if (loadedProfile) {
          // Clean up profile data for logging (exclude binary image data)
          const profileForLogging = {
            ...loadedProfile,
            verificationDocuments: loadedProfile.verificationDocuments?.map((doc: any) => ({
              ...doc,
              data: doc.data ? '[Binary Image Data]' : undefined
            }))
          };
          console.log("ProfileSetup - Loaded profile data:", profileForLogging);

          // Populate user-level fields from fetched userData (or Redux userInfo as fallback)
          console.log("ProfileSetup - Using userData for user fields:", userData);
          if (userData) {
            if (userData.name) setName(userData.name);
            if (userData.email) setEmail(userData.email);
            if (userData.phone) setPhone(userData.phone);
            // @ts-ignore - languagesSpoken might not be in type definition yet
            if (userData.languagesSpoken) setLanguages(userData.languagesSpoken);
          }

          // Populate priest-specific fields from profile
          if (loadedProfile.experience) setExperience(loadedProfile.experience.toString());
          if (loadedProfile.religiousTradition) setReligiousTradition(loadedProfile.religiousTradition);
          if (loadedProfile.description) setDescription(loadedProfile.description);
          if (loadedProfile.templesAffiliated && loadedProfile.templesAffiliated.length > 0) {
            setTemplesAffiliated(loadedProfile.templesAffiliated);
          }
          if (loadedProfile.availability) {
            setAvailability(loadedProfile.availability);
          }

          if (loadedProfile.services && loadedProfile.services.length > 0) {
            mappedCeremonies = mappedCeremonies.map((ceremony: any) => {
              const service = loadedProfile.services.find((s: any) =>
                (s.ceremonyId && (s.ceremonyId._id === ceremony.id || s.ceremonyId === ceremony.id)) ||
                s.name === ceremony.name
              );

              return {
                ...ceremony,
                selected: !!service,
                price: service ? service.price.toString() : ceremony.price,
              };
            });
          } else if (loadedProfile.ceremonies) {
            mappedCeremonies = mappedCeremonies.map((ceremony: any) => {
              const isSelected = loadedProfile.ceremonies.includes(ceremony.name);
              const price = loadedProfile.priceList?.[ceremony.name] || ceremony.price;
              return {
                ...ceremony,
                selected: isSelected,
                price: price.toString(),
              };
            });
          }
        }

        setAvailableCeremonies(mappedCeremonies);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        Alert.alert("Error", "Failed to load data. Please check your connection.");
      } finally {
        setIsLoadingCeremonies(false);
      }
    };

    fetchAndSetupData();
  }, [isEditing]);

  // Temple handlers
  const addTemple = () => {
    setTemplesAffiliated([...templesAffiliated, { name: "", address: "" }]);
  };

  const removeTemple = (index: number) => {
    if (templesAffiliated.length > 1) {
      const updatedTemples = [...templesAffiliated];
      updatedTemples.splice(index, 1);
      setTemplesAffiliated(updatedTemples);
    }
  };

  const updateTemple = (index: number, field: string, value: string) => {
    const updatedTemples = [...templesAffiliated];
    (updatedTemples[index] as any)[field] = value;
    setTemplesAffiliated(updatedTemples);
  };

  // Ceremony handlers - Wrapped in useCallback
  const toggleCeremony = useCallback((id: string) => {
    setAvailableCeremonies((prev) =>
      prev.map((ceremony) =>
        ceremony.id === id
          ? { ...ceremony, selected: !ceremony.selected }
          : ceremony
      )
    );
  }, []);

  const updateCeremonyPrice = useCallback((id: string, price: string) => {
    setAvailableCeremonies((prev) =>
      prev.map((ceremony) =>
        ceremony.id === id ? { ...ceremony, price } : ceremony
      )
    );
  }, []);

  // Availability handlers
  const toggleDayAvailability = (day: string) => {
    setAvailability((prev: any) => {
      const currently = prev[day];
      const nowAvailable = !currently.available;
      const updatedDay = { ...currently, available: nowAvailable };
      if (nowAvailable && (!updatedDay.startTime || !updatedDay.endTime)) {
        updatedDay.startTime = defaultStart;
        updatedDay.endTime = defaultEnd;
      }
      return { ...prev, [day]: updatedDay };
    });
    setTimeErrors((prev) => ({ ...prev, [day]: "" }));
  };

  const updateTimeSlot = (day: string, field: string, value: string) => {
    setAvailability((prev: any) => {
      const updated = { ...prev };
      updated[day] = { ...updated[day], [field]: value };

      const updatedDay = updated[day];
      const newVal = field === "startTime" ? value : updatedDay.startTime;
      const newEnd = field === "endTime" ? value : updatedDay.endTime;
      const err = validateTimePair(newVal, newEnd);

      return updated;
    });
  };

  const setDefaultTimes = (start = "09:00", end = "18:00") => {
    const updated: any = { ...availability };
    Object.keys(updated).forEach((d) => {
      updated[d] = { ...updated[d], startTime: start, endTime: end };
    });
    setAvailability(updated);
  };

  const applyToAllDays = (fromDay: string) => {
    const source = (availability as any)[fromDay];
    if (!source) return;
    const updated: any = { ...availability };
    Object.keys(updated).forEach((d) => {
      updated[d] = { ...updated[d], startTime: source.startTime, endTime: source.endTime, available: source.available };
    });
    setAvailability(updated);
  };

  // Form submission
  const handleSubmit = async () => {
    console.log("ProfileSetup - handleSubmit called");
    console.log("ProfileSetup - editSection:", editSection);
    console.log("ProfileSetup - Form values:", { name, email, phone, experience, religiousTradition, languages });

    // Section-aware validation
    if (editSection === 'personalDetails') {
      // Only validate personal details fields
      if (!name || !experience || !religiousTradition) {
        console.log("ProfileSetup - Validation failed for personalDetails");
        Alert.alert("Validation Error", "Please fill all required fields (Name, Experience, Religious Tradition)");
        return;
      }
    } else if (editSection === 'contactInfo') {
      // Only validate contact info fields
      if (!email || !phone) {
        console.log("ProfileSetup - Validation failed for contactInfo");
        Alert.alert("Validation Error", "Please fill all required fields (Email, Phone)");
        return;
      }
    } else {
      // Full form validation (when not editing a specific section)
      if (!name || !email || !phone || !experience || !religiousTradition) {
        console.log("ProfileSetup - Validation failed for full form");
        Alert.alert("Validation Error", "Please fill all required fields");
        return;
      }
    }

    const newErrors: Record<string, string> = {};
    Object.entries(availability).forEach(([day, data]) => {
      if (data.available) {
        const err = validateTimePair(data.startTime, data.endTime);
        if (err) newErrors[day] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setTimeErrors(newErrors);
      Alert.alert("Validation Error", "Please fix availability time errors before submitting.");
      return;
    }

    const selectedCeremonies = availableCeremonies
      .filter((ceremony) => ceremony.selected)
      .map((ceremony) => ceremony.name);

    if (selectedCeremonies.length === 0) {
      Alert.alert("Validation Error", "Please select at least one ceremony");
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        experience: parseInt(experience, 10),
        religiousTradition,
        description,
        templesAffiliated: templesAffiliated.filter(
          (temple: any) => temple.name && temple.address
        ),
        availability,
        services: availableCeremonies
          .filter((ceremony) => ceremony.selected)
          .map((ceremony) => ({
            ceremonyId: ceremony.id,
            price: parseInt(ceremony.price, 10),
            durationMinutes: ceremony.duration || 60,
          })),
      };

      console.log("ProfileSetup - Submitting profile data:", JSON.stringify(profileData, null, 2));
      console.log("ProfileSetup - Selected ceremonies count:", availableCeremonies.filter(c => c.selected).length);

      await (dispatch as any)(updateProfile(profileData as any));

      // Prepare user-level updates (name, email, phone, languages)
      // Note: We need to fetch current user data to compare, since userInfo might be null
      let currentUserData = userInfo;
      if (!currentUserData) {
        try {
          const userResponse = await api.get('/api/users/profile');
          currentUserData = userResponse.data?.data || userResponse.data;
        } catch (err) {
          console.warn("Failed to fetch current user data for comparison:", err);
        }
      }

      const userUpdateData: any = {};
      if (name !== currentUserData?.name) userUpdateData.name = name;
      if (email !== currentUserData?.email) userUpdateData.email = email;
      if (phone !== currentUserData?.phone) userUpdateData.phone = phone;

      // Check if languages have changed
      const currentLanguages = currentUserData?.languagesSpoken || [];
      const languagesChanged = JSON.stringify(currentLanguages.sort()) !== JSON.stringify(languages.sort());
      if (languagesChanged) {
        console.log("ProfileSetup - Languages changed, updating:", { from: currentLanguages, to: languages });
        userUpdateData.languagesSpoken = languages;
      }

      if (Object.keys(userUpdateData).length > 0) {
        console.log("ProfileSetup - Updating user data:", userUpdateData);
        await (dispatch as any)(
          updateProfile(userUpdateData)
        );
      }

      // Small delay to ensure backend and Redux state are updated
      await new Promise(resolve => setTimeout(resolve, 300));

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert(
        "Update Failed",
        "Failed to update your profile. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep === 1) {
      if (!name || !email || !phone || !experience || !religiousTradition) {
        Alert.alert("Validation Error", "Please fill all required fields");
        return;
      }
    } else if (currentStep === 2) {
      const selectedCeremonies = availableCeremonies.filter(
        (ceremony) => ceremony.selected
      );
      if (selectedCeremonies.length === 0) {
        Alert.alert("Validation Error", "Please select at least one ceremony");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render Steps
  const renderStep1 = () => {
    // Determine which fields to show based on editSection
    const showPersonalDetails = !editSection || editSection === 'personalDetails';
    const showContactInfo = !editSection || editSection === 'contactInfo';

    return (
      <ScrollView style={styles.content}>
        <Text style={styles.stepTitle}>
          {editSection === 'personalDetails' ? 'Personal Details' :
            editSection === 'contactInfo' ? 'Contact Information' :
              'Basic Information'}
        </Text>

        {showPersonalDetails && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={APP_COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Years of Experience *</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
                placeholder="Enter years of experience"
                placeholderTextColor={APP_COLORS.gray}
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
                placeholderTextColor={APP_COLORS.gray}
              />
            </View>

            <LanguagePicker
              selectedLanguages={languages}
              onChange={setLanguages}
            />
          </>
        )}

        {showContactInfo && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={APP_COLORS.gray}
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
                placeholderTextColor={APP_COLORS.gray}
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        {!editSection && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (About Yourself)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your experience, specialties, and services"
              placeholderTextColor={APP_COLORS.gray}
              multiline
              numberOfLines={4}
            />
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={availableCeremonies}
        renderItem={({ item }) => (
          <CeremonyItem
            ceremony={item}
            onToggle={toggleCeremony}
            onUpdatePrice={updateCeremonyPrice}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text style={styles.stepTitle}>Services & Pricing</Text>
            <Text style={styles.stepSubtitle}>
              Select the ceremonies you offer and set your pricing
            </Text>

            {isLoadingCeremonies && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: APP_COLORS.gray }}>Loading ceremonies...</Text>
              </View>
            )}

            {!isLoadingCeremonies && availableCeremonies.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: APP_COLORS.gray, marginBottom: 8 }}>No ceremonies available</Text>
                <Text style={{ color: APP_COLORS.gray, fontSize: 12 }}>
                  Please contact support if this issue persists
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={APP_COLORS.primary}
            />
            <Text style={styles.addButtonText}>Add Custom Ceremony</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.stepTitle}>Temple Affiliation</Text>
      <Text style={styles.stepSubtitle}>
        Add temples you are affiliated with
      </Text>

      {(templesAffiliated || []).map((temple: any, index: number) => (
        <View key={index} style={styles.templeItem}>
          <View style={styles.templeHeader}>
            <Text style={styles.templeIndex}>Temple {index + 1}</Text>
            {index > 0 && (
              <TouchableOpacity
                onPress={() => removeTemple(index)}
                style={styles.removeButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={APP_COLORS.error}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temple Name</Text>
            <TextInput
              style={styles.input}
              value={temple.name}
              onChangeText={(value) => updateTemple(index, "name", value)}
              placeholder="Enter temple name"
              placeholderTextColor={APP_COLORS.gray}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temple Address</Text>
            <TextInput
              style={styles.input}
              value={temple.address}
              onChangeText={(value) => updateTemple(index, "address", value)}
              placeholder="Enter temple address"
              placeholderTextColor={APP_COLORS.gray}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addTemple}>
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={APP_COLORS.primary}
        />
        <Text style={styles.addButtonText}>Add Another Temple</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.stepTitle}>Availability</Text>
      <Text style={styles.stepSubtitle}>Set your weekly availability</Text>

      {/* Defaults editor */}
      <View style={styles.availabilityActions}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ marginRight: 8, color: APP_COLORS.gray }}>Defaults</Text>
          <TextInput
            style={[styles.timeInput, styles.smallTimeInput]}
            value={defaultStart}
            onChangeText={setDefaultStart}
            placeholder="From"
            placeholderTextColor={APP_COLORS.gray}
          />
          <TextInput
            style={[styles.timeInput, styles.smallTimeInput, { marginLeft: 8 }]}
            value={defaultEnd}
            onChangeText={setDefaultEnd}
            placeholder="To"
            placeholderTextColor={APP_COLORS.gray}
          />
        </View>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={[styles.actionButton, { marginRight: 8 }]}
            onPress={() => setDefaultTimes(defaultStart, defaultEnd)}
          >
            <Text style={styles.actionButtonText}>Apply defaults</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => applyToAllDays("monday")}
          >
            <Text style={styles.actionButtonText}>Copy Mon → all</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Per-day rows */}
      {Object.entries(availability).map(([day, data]) => (
        <View key={day} style={styles.availabilityItem}>
          <View style={styles.availabilityDay}>
            <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <Switch
              value={!!data.available}
              onValueChange={() => toggleDayAvailability(day)}
              trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + "80" }}
              thumbColor={data.available ? APP_COLORS.primary : APP_COLORS.gray}
            />
          </View>

          {data.available ? (
            <View style={styles.timeSlots}>
              <View style={styles.timeSlot}>
                <Text style={styles.timeLabel}>From</Text>
                <TextInput
                  style={[styles.timeInput, styles.smallTimeInput]}
                  value={data.startTime}
                  onChangeText={(value) => updateTimeSlot(day, "startTime", value)}
                  placeholder="09:00"
                  placeholderTextColor={APP_COLORS.gray}
                />
                {timeErrors[day] ? (
                  <Text style={{ color: APP_COLORS.error, marginTop: 6 }}>{timeErrors[day]}</Text>
                ) : null}
              </View>
              <View style={styles.timeSlot}>
                <Text style={styles.timeLabel}>To</Text>
                <TextInput
                  style={[styles.timeInput, styles.smallTimeInput]}
                  value={data.endTime}
                  onChangeText={(value) => updateTimeSlot(day, "endTime", value)}
                  placeholder="18:00"
                  placeholderTextColor={APP_COLORS.gray}
                />
              </View>
              <TouchableOpacity
                style={{ marginLeft: 12, alignSelf: "center" }}
                onPress={() => applyToAllDays(day)}
              >
                <Text style={{ color: APP_COLORS.primary, fontWeight: "600" }}>Apply to all</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: APP_COLORS.gray, marginTop: 8 }}>You're marked unavailable on this day.</Text>
          )}
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={HEADER_TOP_PADDING + 24}
      >
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.header,
              {
                paddingTop: HEADER_TOP_PADDING,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
          >
            <Text style={styles.headerTitle}>{isEditing ? "Edit Profile" : "Complete Your Profile"}</Text>
          </View>

          {!isSingleSectionMode && (
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
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={APP_COLORS.white}
                    />
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
          )}

          <View style={{ flex: 1 }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>

          <View style={styles.footer}>
            {isSingleSectionMode ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.nextButtonText}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
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
                      {isSubmitting ? "Submitting..." : "Complete"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView >
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
    fontWeight: "bold",
    textAlign: "center",
  },
  progress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: APP_COLORS.white,
    position: "relative",
  },
  progressLine: {
    position: "absolute",
    height: 3,
    backgroundColor: APP_COLORS.primary,
    left: 40,
    top: "50%",
    marginTop: -1.5,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "bold",
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
    fontWeight: "bold",
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
    textAlignVertical: "top",
  },
  infoText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    paddingVertical: 8,
  },
  ceremonyItem: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
  },
  ceremonyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: APP_COLORS.primary,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    textAlign: "right",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  addButtonText: {
    color: APP_COLORS.primary,
    fontWeight: "600",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  templeIndex: {
    fontSize: 16,
    fontWeight: "600",
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
  availabilityActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  availabilityDay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeSlots: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
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
  smallTimeInput: {
    width: 90,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: APP_COLORS.white,
    fontWeight: "600",
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: APP_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
    marginRight: 8,
  },
  backButtonText: {
    color: APP_COLORS.gray,
    fontWeight: "bold",
  },
  nextButton: {
    backgroundColor: APP_COLORS.primary,
  },
  nextButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
});

export default ProfileSetup;
