import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "../../../utils/storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
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
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { APP_COLORS } from "../../../constants/Colors";
import { updateProfile as updateUserProfile } from "../../../redux/slices/authSlice";
import { updateProfile } from "../../../redux/slices/priestSlice";
import { getAllCeremonies } from "../../../api/ceremonyService";
import priestService from "../../../services/priestService"; // Import service
import LanguagePicker from "../../../components/LanguagePicker";
import api from "../../../api";

const HEADER_TOP_PADDING = Platform.OS === "android" ? 24 : 44;

// Memoized Ceremony Item Component to prevent re-renders
const CeremonyItem = React.memo(({ ceremony, onToggle, onUpdatePrice, onCustomizeSteps }: any) => {
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
      {ceremony.selected && (
        <TouchableOpacity 
          style={styles.customizeStepsBtn}
          onPress={() => onCustomizeSteps(ceremony)}
        >
          <Ionicons name="list" size={16} color={APP_COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.customizeStepsText}>
            Customize Steps {ceremony.customSteps?.length > 0 ? `(${ceremony.customSteps.length})` : ""}
          </Text>
        </TouchableOpacity>
      )}
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [location, setLocation] = useState<{ type: string, coordinates: number[] }>({ type: 'Point', coordinates: [0, 0] });
  const [languages, setLanguages] = useState<string[]>(() => {
    const rawLangs = userInfo?.languagesSpoken || [];
    if (rawLangs.length > 0 && typeof rawLangs[0] === 'object') {
      return rawLangs.map((l: any) => l._id);
    }
    return rawLangs;
  });
  const [templesAffiliated, setTemplesAffiliated] = useState([
    { name: "", address: "" },
  ]);

  const [availableCeremonies, setAvailableCeremonies] = useState<any[]>([]);
  const [isLoadingCeremonies, setIsLoadingCeremonies] = useState(true);

  /* New Schema Handling */
  const [existingOverrides, setExistingOverrides] = useState<any[]>([]);

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
  const [initialStep, setInitialStep] = useState(jumpToStepRaw ? parseInt(jumpToStepRaw as string, 10) : 1);
  const isSingleSectionMode = !!jumpToStepRaw;

  // Modal state
  const [isCustomStepsModalVisible, setIsCustomStepsModalVisible] = useState(false);
  const [currentCustomizingCeremony, setCurrentCustomizingCeremony] = useState<any>(null);

  // Manual fallback inputs
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // Initialize step
  useEffect(() => {
    if (initialStep > 1 && initialStep <= 6) {
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
            const userResponse = await api.get('/api/users/profile');
            userData = userResponse.data?.data || userResponse.data;
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
          // Populate user-level fields from fetched userData (or Redux userInfo as fallback)
          if (userData) {
            if (userData.name) setName(userData.name);
            if (userData.email) setEmail(userData.email);
            if (userData.phone) setPhone(userData.phone);
            // @ts-ignore - languagesSpoken might not be in type definition yet
            if (userData.languagesSpoken) {
              const rawLangs = userData.languagesSpoken;
              const langIds = (rawLangs.length > 0 && typeof rawLangs[0] === 'object')
                ? rawLangs.map((l: any) => l._id)
                : rawLangs;
              setLanguages(langIds);
            }
          }

          // Populate priest-specific fields from profile
          if (loadedProfile.experience) setExperience(loadedProfile.experience.toString());
          if (loadedProfile.religiousTradition) setReligiousTradition(loadedProfile.religiousTradition);
          if (loadedProfile.description) setDescription(loadedProfile.description);
          if (loadedProfile.profilePicture) setProfilePicture(loadedProfile.profilePicture);
          if (loadedProfile.location) setLocation(loadedProfile.location);
          if (loadedProfile.templesAffiliated && loadedProfile.templesAffiliated.length > 0) {
            setTemplesAffiliated(loadedProfile.templesAffiliated);
          }
          if (loadedProfile.availability) {
            console.log('DEBUG: Loaded Availability from profile:', JSON.stringify(loadedProfile.availability));

            // Handle new schema: weeklySchedule
            const schedule = loadedProfile.availability.weeklySchedule || {};
            const overrides = loadedProfile.availability.dateOverrides || [];
            setExistingOverrides(overrides);

            const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const newAvailabilityState: any = {};

            if (Object.keys(schedule).length > 0) {
              days.forEach(day => {
                const slots = schedule[day];
                if (slots && slots.length > 0) {
                  // Assume first slot for now: "09:00-17:00"
                  const [start, end] = slots[0].split('-');
                  newAvailabilityState[day] = { available: true, startTime: start, endTime: end };
                } else {
                  newAvailabilityState[day] = { available: false, startTime: "09:00", endTime: "18:00" };
                }
              });
              setAvailability(newAvailabilityState);
            } else if (loadedProfile.availability.monday) {
              // Fallback for old schema if it exists in DB temporarily
              setAvailability(loadedProfile.availability);
            } else {
              // Default
              days.forEach(day => {
                newAvailabilityState[day] = { available: false, startTime: "09:00", endTime: "18:00" };
              });
              setAvailability(newAvailabilityState);
            }
          } else {
            console.log('DEBUG: No availability (or empty) in loaded profile. Populating defaults.');
            const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const defaults: any = {};
            days.forEach(day => {
              defaults[day] = { available: false, startTime: "09:00", endTime: "18:00" };
            });
            setAvailability(defaults);
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

  const openCustomizeSteps = (ceremony: any) => {
    setCurrentCustomizingCeremony({
      ...ceremony,
      customSteps: ceremony.customSteps || []
    });
    setIsCustomStepsModalVisible(true);
  };

  const saveCustomSteps = () => {
    if (!currentCustomizingCeremony) return;

    setAvailableCeremonies((prev) =>
      prev.map((c) =>
        c.id === currentCustomizingCeremony.id
          ? { ...c, customSteps: currentCustomizingCeremony.customSteps }
          : c
      )
    );
    setIsCustomStepsModalVisible(false);
  };

  const addCustomStep = () => {
    setCurrentCustomizingCeremony((prev: any) => ({
      ...prev,
      customSteps: [
        ...prev.customSteps,
        { title: "", description: "", durationEstimate: 15, extraCharge: 0 }
      ]
    }));
  };

  const updateCustomStep = (index: number, field: string, value: any) => {
    setCurrentCustomizingCeremony((prev: any) => {
      const updatedSteps = [...prev.customSteps];
      updatedSteps[index] = { ...updatedSteps[index], [field]: value };
      return { ...prev, customSteps: updatedSteps };
    });
  };

  const removeCustomStep = (index: number) => {
    setCurrentCustomizingCeremony((prev: any) => {
      const updatedSteps = [...prev.customSteps];
      updatedSteps.splice(index, 1);
      return { ...prev, customSteps: updatedSteps };
    });
  };

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
  // --- LOCATION LOGIC ---
  const getCurrentLocation = async () => {
    Keyboard.dismiss();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please use the manual entry fallback below.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        type: 'Point',
        coordinates: [loc.coords.longitude, loc.coords.latitude]
      });
      setManualLat(loc.coords.latitude.toString());
      setManualLng(loc.coords.longitude.toString());
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Could not fetch location. Please use manual entry.");
    }
  };

  const handleManualLocationUpdate = () => {
    Keyboard.dismiss();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert("Invalid Input", "Please enter valid coordinates (Lat -90 to 90, Lng -180 to 180)");
      return;
    }

    setLocation({
      type: 'Point',
      coordinates: [lng, lat]
    });
    Alert.alert("Success", "Manual location updated successfully.");
  };

  // Form submission
  const handleSubmit = async () => {
    // Section-aware validation
    if (editSection === 'personalDetails') {
      // Only validate personal details fields
      if (!name || !experience || !religiousTradition) {
        Alert.alert("Validation Error", "Please fill all required fields (Name, Experience, Religious Tradition)");
        return;
      }
    } else if (editSection === 'contactInfo') {
      // Only validate contact info fields
      if (!email || !phone) {
        Alert.alert("Validation Error", "Please fill all required fields (Email, Phone)");
        return;
      }
    } else if (editSection === 'temples') {
      // Basic check for at least one temple if they are on the temple section
      const validTemples = templesAffiliated.filter((t) => t.name && t.address);
      if (validTemples.length === 0 && templesAffiliated.length > 0 && (templesAffiliated[0].name || templesAffiliated[0].address)) {
          Alert.alert("Validation Error", "Please provide both name and address for the temple, or remove it.");
          return;
      }
    } else {
      // Full form validation (when not editing a specific section)
      if (!name || !email || !phone || !experience || !religiousTradition) {
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

    // Only validate ceremonies if we are in initial setup OR editing services
    // If editSection is 'personalDetails', 'availability', 'contactInfo', or 'temples', skip this check
    if ((!editSection || editSection === 'services') && selectedCeremonies.length === 0) {
      Alert.alert("Validation Error", "Please select at least one ceremony");
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct Weekly Schedule Payload
      const weeklySchedulePayload: any = {};
      Object.entries(availability).forEach(([day, data]: [string, any]) => {
        if (data.available && data.startTime && data.endTime) {
          weeklySchedulePayload[day] = [`${data.startTime}-${data.endTime}`];
        } else {
          weeklySchedulePayload[day] = [];
        }
      });

      const profileData = {
        experience: parseInt(experience, 10),
        religiousTradition,
        description,
        location,
        templesAffiliated: templesAffiliated.filter(
          (temple: any) => temple.name && temple.address
        ),
        availability: {
          weeklySchedule: weeklySchedulePayload,
          dateOverrides: existingOverrides
        },
        services: availableCeremonies
          .filter((ceremony) => ceremony.selected)
          .map((ceremony) => ({
            ceremonyId: ceremony.id,
            price: parseInt(ceremony.price, 10) || 0, // Fallback to 0 if NaN
            durationMinutes: ceremony.duration || 60,
            customSteps: ceremony.customSteps || [],
          })),
      };

      console.log('DEBUG: Priest Profile Update Payload:', JSON.stringify(profileData, null, 2)); // DEBUG LOG

      // Use priestService to update priest-specific profile data
      await priestService.updateProfile(profileData);

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
      const currentLanguagesRaw = currentUserData?.languagesSpoken || [];
      const currentLanguageIds = (currentLanguagesRaw.length > 0 && typeof currentLanguagesRaw[0] === 'object')
        ? currentLanguagesRaw.map((l: any) => l._id)
        : currentLanguagesRaw;
      console.log('DEBUG: New Languages State:', languages);

      const languagesChanged = JSON.stringify(currentLanguageIds.sort()) !== JSON.stringify([...languages].sort());
      console.log('DEBUG: Languages Changed?', languagesChanged);

      if (languagesChanged) {
        userUpdateData.languagesSpoken = languages;
      }

      console.log('DEBUG: User Update Payload:', userUpdateData);

      if (Object.keys(userUpdateData).length > 0) {
        console.log('DEBUG: Dispatching updateUserProfile...');
        try {
          // Explicitly casing the import to avoid confusion
          const result = await (dispatch as any)(updateUserProfile(userUpdateData));

          if (updateUserProfile.fulfilled.match(result)) {
            console.log('DEBUG: updateUserProfile dispatched successfully (Fulfilled).');
          } else {
            console.error('DEBUG: updateUserProfile failed (Rejected):', result.payload || result.error);
          }
        } catch (err) {
          console.error('DEBUG: updateUserProfile dispatch threw error:', err);
        }
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
      if (!location || location.coordinates[0] === 0) {
        Alert.alert("Validation Error", "Please provide your location to continue (use GPS or manual entry).");
        return;
      }
    } else if (currentStep === 3) {
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

  // Image Picker Logic
  const pickImage = async () => {
    try {
      console.log('DEBUG: pickImage function called!');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setProfilePicture(asset.uri);

        // Auto-upload
        try {
          const fileData = {
            uri: asset.uri,
            name: asset.fileName || "profile.jpg",
            type: asset.mimeType || "image/jpeg"
          };

          Alert.alert("Uploading", "Updating profile picture...");
          await priestService.uploadDocument(fileData, 'profile_picture');
          // Alert.alert("Success", "Profile picture updated!");
        } catch (err: any) {
          console.error("Profile pic upload failed:", err);
          Alert.alert("Error", "Failed to upload profile picture: " + err.toString());
        }
      }
    } catch (error) {
      console.error("Pick image error:", error);
    }
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
            {/* Profile Picture Section - Refactored */}
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.profilePicButton}
                activeOpacity={0.8}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="camera" size={40} color={APP_COLORS.gray} />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={14} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePicText}>
                {profilePicture ? 'Change Profile Photo' : 'Upload Profile Photo'}
              </Text>
            </View>

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

            <View style={styles.formGroup}>
              <Text style={styles.label}>About You (Description)</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 12 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell devotees about your background and approach..."
                placeholderTextColor={APP_COLORS.gray}
                multiline
                numberOfLines={4}
              />
            </View>
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
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.stepTitle}>Location & Region</Text>
      <Text style={styles.stepSubtitle}>Where do you provide your services?</Text>

      <View style={[styles.formGroup, { marginTop: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: 16, borderRadius: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
              GPS Location: {location && location.coordinates[0] !== 0 ? 'Set' : 'Not Set'}
            </Text>
            <Text style={{ fontSize: 13, color: '#666' }}>
              {location && location.coordinates[0] !== 0
                ? `Lat: ${location.coordinates[1].toFixed(4)}, Lng: ${location.coordinates[0].toFixed(4)}`
                : 'Tap to detect location automatically'}
            </Text>
          </View>
          <TouchableOpacity onPress={getCurrentLocation} style={{ backgroundColor: APP_COLORS.primary, padding: 14, borderRadius: 8 }}>
            <Ionicons name="location" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.manualLocationWrapper}>
          <Text style={styles.manualFallbackLabel}>Or enter location manually (if GPS fails/is blocked):</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Latitude"
              value={manualLat}
              onChangeText={setManualLat}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.manualInput}
              placeholder="Longitude"
              value={manualLng}
              onChangeText={setManualLng}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity onPress={handleManualLocationUpdate} style={styles.manualUpdateBtn}>
            <Text style={styles.manualUpdateBtnText}>Update Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={availableCeremonies}
        renderItem={({ item }) => (
          <CeremonyItem
            ceremony={item}
            onToggle={toggleCeremony}
            onUpdatePrice={updateCeremonyPrice}
            onCustomizeSteps={openCustomizeSteps}
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

  const renderStep4 = () => (
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

  const renderStep5 = () => (
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
      {
        Object.entries(availability).map(([day, data]) => (
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
              <View style={{ flexDirection: 'column' }}>
                <View style={styles.timeSlots}>
                  <View style={[styles.timeSlot, { width: '45%' }]}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TextInput
                      style={[styles.timeInput, styles.smallTimeInput]}
                      value={data.startTime}
                      onChangeText={(value) => updateTimeSlot(day, "startTime", value)}
                      placeholder="09:00"
                      placeholderTextColor={APP_COLORS.gray}
                    />
                  </View>
                  <View style={[styles.timeSlot, { width: '45%' }]}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TextInput
                      style={[styles.timeInput, styles.smallTimeInput]}
                      value={data.endTime}
                      onChangeText={(value) => updateTimeSlot(day, "endTime", value)}
                      placeholder="18:00"
                      placeholderTextColor={APP_COLORS.gray}
                    />
                  </View>
                </View>
                {timeErrors[day] ? (
                  <Text style={{ color: APP_COLORS.error, marginTop: 4 }}>{timeErrors[day]}</Text>
                ) : null}
                <TouchableOpacity
                  style={{ marginTop: 8, alignSelf: "flex-start" }}
                  onPress={() => applyToAllDays(day)}
                >
                  <Text style={{ color: APP_COLORS.primary, fontWeight: "600" }}>Apply to all days</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: APP_COLORS.gray, marginTop: 8 }}>You're marked unavailable on this day.</Text>
            )}
          </View>
        ))
      }
      <View style={{ height: 20 }} />
    </ScrollView >
  );

  const renderStep6 = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.stepTitle}>Verification Documents</Text>
      <Text style={styles.stepSubtitle}>Upload your Aadhaar & optionally a Vedapatashala certificate</Text>

      <View style={[styles.formGroup, { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 12, marginTop: 16 }]}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>Aadhaar Card (Required)</Text>
        <Text style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>This is required to verify your identity before you can accept bookings.</Text>
        <TouchableOpacity
          style={{ backgroundColor: APP_COLORS.primary, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          onPress={async () => {
            try {
              const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
              if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                Alert.alert("Uploading", "Uploading Aadhaar...");
                await priestService.uploadDocument({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/pdf' }, 'aadhaar_card');
                Alert.alert("Success", "Aadhaar uploaded successfully!");
              }
            } catch (err) {
              Alert.alert("Error", "Failed to upload document: " + err);
            }
          }}
        >
          <Ionicons name="document-attach" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Upload PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.formGroup, { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 12, marginTop: 16 }]}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>Vedapatashala Certificate (Optional)</Text>
        <Text style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Upload your qualification to earn the Verified Pundit badge.</Text>
        <TouchableOpacity
          style={{ backgroundColor: APP_COLORS.primary, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          onPress={async () => {
            try {
              const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
              if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                Alert.alert("Uploading", "Uploading Certificate...");
                await priestService.uploadDocument({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/pdf' }, 'vedapatashala_cert');
                Alert.alert("Success", "Certificate uploaded successfully!");
              }
            } catch (err) {
              Alert.alert("Error", "Failed to upload document: " + err);
            }
          }}
        >
          <Ionicons name="document-attach" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Upload PDF</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderCustomStepsModal = () => (
    <Modal
      visible={isCustomStepsModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Customize: {currentCustomizingCeremony?.name}
            </Text>
            <TouchableOpacity onPress={() => setIsCustomStepsModalVisible(false)}>
              <Ionicons name="close" size={24} color={APP_COLORS.black} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Standard Steps - Read Only */}
            <Text style={styles.modalSectionTitle}>Standard Inclusions</Text>
            {(() => {
              const RITUAL_DEFAULTS: Record<string, any[]> = {
                "satyanarayan": [
                  { stepNumber: 1, title: "Swasti Vachanam", description: "Seeking blessings and purification." },
                  { stepNumber: 2, title: "Maha Sankalp", description: "Solemn vow for the ritual purpose." },
                  { stepNumber: 3, title: "Gauri Ganeshi Puja", description: "Invocation of Goddess Gauri and Lord Ganesha." },
                  { stepNumber: 4, title: "Kalash Navgraha Puja", description: "Invocation of deities in Kalash and 9 planets." },
                  { stepNumber: 5, title: "Satyanarayan Katha & Puja", description: "Main ritual, story narration, and puja." },
                  { stepNumber: 6, title: "Aarti & Prasad", description: "Final prayers and food distribution." }
                ],
                "ganesh": [
                  { stepNumber: 1, title: "Ganesh Prarthna", description: "Initial prayer to Lord Ganesha." },
                  { stepNumber: 2, title: "Kalash Pooja", description: "Invocation of deities in the sacred water pot." },
                  { stepNumber: 3, title: "Sodasaupachar Puja", description: "Traditional 16-step worship." },
                  { stepNumber: 4, title: "Ganesh Puja", description: "Detailed worship with mantras and offerings." },
                  { stepNumber: 5, title: "Ganesh Aarti", description: "Singing of hymns and offering light." }
                ]
              };

              let stepsToShow = currentCustomizingCeremony?.ritualSteps || [];
              if (stepsToShow.length === 0 && currentCustomizingCeremony?.name) {
                const nameLower = currentCustomizingCeremony.name.toLowerCase();
                for (const [key, defaults] of Object.entries(RITUAL_DEFAULTS)) {
                  if (nameLower.includes(key)) {
                    stepsToShow = defaults;
                    break;
                  }
                }
              }

              if (stepsToShow.length > 0) {
                return [...stepsToShow]
                  .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
                  .map((step: any, index: number) => (
                    <View key={`std-${index}`} style={styles.readOnlyStep}>
                      <Text style={styles.readOnlyStepTitle}>{step.title}</Text>
                      <Text style={styles.readOnlyStepDesc}>{step.description}</Text>
                    </View>
                  ));
              }

              return <Text style={styles.noDataText}>No standard steps defined.</Text>
            })()}

            {/* Custom Steps - Editable */}
            <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingHorizontal: 0, marginTop: 16 }]}>
              <Text style={styles.modalSectionTitle}>Additional Steps by You</Text>
              <TouchableOpacity onPress={addCustomStep}>
                <Ionicons name="add-circle" size={24} color={APP_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {(currentCustomizingCeremony?.customSteps || []).map((step: any, index: number) => (
              <View key={`custom-${index}`} style={styles.customStepEditCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', color: APP_COLORS.primary }}>Step {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeCustomStep(index)}>
                    <Ionicons name="trash-outline" size={18} color={APP_COLORS.error} />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={[styles.input, { marginBottom: 8 }]}
                  placeholder="Step Title (e.g. Special Aarti)"
                  value={step.title}
                  onChangeText={(val) => updateCustomStep(index, 'title', val)}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { marginBottom: 8 }]}
                  placeholder="Step Description"
                  multiline={true}
                  value={step.description}
                  onChangeText={(val) => updateCustomStep(index, 'description', val)}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: APP_COLORS.gray, marginRight: 8 }}>Duration (mins):</Text>
                    <TextInput
                      style={[styles.input, { width: 60, padding: 4, textAlign: 'center' }]}
                      keyboardType="numeric"
                      value={String(step.durationEstimate || 0)}
                      onChangeText={(val) => updateCustomStep(index, 'durationEstimate', parseInt(val, 10) || 0)}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: APP_COLORS.gray, marginRight: 8 }}>Extra Charge (₹):</Text>
                    <TextInput
                      style={[styles.input, { width: 80, padding: 4, textAlign: 'center' }]}
                      keyboardType="numeric"
                      value={String(step.extraCharge || 0)}
                      onChangeText={(val) => updateCustomStep(index, 'extraCharge', parseInt(val, 10) || 0)}
                    />
                  </View>
                </View>
              </View>
            ))}

            {currentCustomizingCeremony?.customSteps?.length === 0 && (
              <Text style={[styles.noDataText, { textAlign: 'center', marginTop: 10 }]}>
                Add your own unique ritual steps to stand out!
              </Text>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={() => setIsCustomStepsModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalSaveButton]} 
              onPress={saveCustomSteps}
            >
              <Text style={styles.modalSaveButtonText}>Apply Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFFFFF', '#FDFBF7']} style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: 20 }]}>
        <View style={styles.headerRow}>
          {isEditing && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={APP_COLORS.tertiary} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{isEditing ? "Edit Profile" : "Complete Your Profile"}</Text>
          {isEditing && <View style={{ width: 34 }} />}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={24}
      >
        {!isSingleSectionMode && (
          <View style={styles.progress}>
            {[1, 2, 3, 4, 5, 6].map((step) => (
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
                { width: `${(currentStep - 1) * 20}%` },
              ]}
            />
          </View>
        )}

        <View style={{ flex: 1 }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </View>

        {renderCustomStepsModal()}

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
                {isSubmitting ? (
                  <ActivityIndicator color={APP_COLORS.white} />
                ) : (
                  <Text style={styles.nextButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={currentStep === 6 ? handleSubmit : () => setCurrentStep(currentStep + 1)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={APP_COLORS.white} />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {currentStep === 6 ? "Complete" : "Next"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
          </View>
      </KeyboardAvoidingView>
    </View>
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
  header: {
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backBtn: { position: 'absolute', left: 20, padding: 5 },
  headerTitle: { 
    color: APP_COLORS.tertiary, 
    fontSize: 20, 
    fontWeight: "bold",
    fontFamily: 'serif',
    textAlign: 'center'
  },
  // Manual Location Fallback
  manualLocationWrapper: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  manualFallbackLabel: {
    fontSize: 13,
    color: APP_COLORS.gray,
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  manualInput: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  manualUpdateBtn: {
    backgroundColor: APP_COLORS.secondary || '#f39c12',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualUpdateBtnText: {
    color: 'white',
    fontWeight: 'bold',
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
    fontFamily: 'serif',
    fontSize: 16,
  },
  // New Profile Picture Styles
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  profilePicButton: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: APP_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profilePicText: {
    color: APP_COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  customizeStepsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  customizeStepsText: {
    color: APP_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_COLORS.tertiary,
    fontFamily: 'serif',
  },
  modalScroll: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: APP_COLORS.black,
  },
  readOnlyStep: {
    backgroundColor: APP_COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.primary,
  },
  readOnlyStepTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyStepDesc: {
    fontSize: 13,
    color: APP_COLORS.gray,
  },
  customStepEditCard: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
    marginRight: 12,
  },
  modalSaveButton: {
    backgroundColor: APP_COLORS.primary,
  },
  modalCancelButtonText: {
    color: APP_COLORS.gray,
    fontWeight: 'bold',
  },
  modalSaveButtonText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontStyle: 'italic',
  },
});

export default ProfileSetup;
