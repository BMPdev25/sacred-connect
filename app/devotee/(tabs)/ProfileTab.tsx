import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { APP_COLORS } from "../../../constants/Colors";
import { logout, updateUserProfile } from "../../../redux/slices/authSlice";
import { updateNotificationPreferences } from "../../../redux/slices/userSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import Card from "../../../components/Card";
import api, { API_BASE_URL } from "../../../api";
import { auth } from "../../../config/firebase";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { LinearGradient } from "expo-linear-gradient";

// ─── Component ────────────────────────────────────────────────────────────
const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  // Local state for profile data
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Personal Details State
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: new Date(),
  });
  const [isPersonalModalVisible, setIsPersonalModalVisible] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Family Details State
  const [familyDetails, setFamilyDetails] = useState({
    gotra: "",
    nakshatra: "",
    rashi: "",
  });
  const [isFamilyModalVisible, setIsFamilyModalVisible] = useState(false);
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  // Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Notification preferences
  const authUserInfo = useSelector((state: RootState) => state.auth.userInfo);
  const userNotifications = (authUserInfo as any)?.notifications || {
    email: { bookingUpdates: true, promotions: false, reminders: true },
    push: { bookingUpdates: true, promotions: false, reminders: true },
  };

  const [notifyUpcoming, setNotifyUpcoming] = useState<boolean>(
    userNotifications.push?.bookingUpdates ?? true
  );
  const [notifyConfirmations, setNotifyConfirmations] = useState<boolean>(
    userNotifications.push?.reminders ?? true
  );
  const [notifyPromotions, setNotifyPromotions] = useState<boolean>(
    userNotifications.push?.promotions ?? false
  );

  // Fetch profile data on mount or focus
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await api.get('/api/users/profile');
      if (response.data && response.data.success) {
        const data = response.data.data;
        setProfileData(data);

        if (data.familyDetails) {
          setFamilyDetails({
            gotra: data.familyDetails.gotra || "",
            nakshatra: data.familyDetails.nakshatra || "",
            rashi: data.familyDetails.rashi || "",
          });
        }

        if (data.notifications && data.notifications.push) {
          setNotifyUpcoming(data.notifications.push.bookingUpdates ?? true);
          setNotifyConfirmations(data.notifications.push.reminders ?? true);
          setNotifyPromotions(data.notifications.push.promotions ?? false);
        }

        // Populate Personal Details
        setPersonalDetails({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const onToggle = (
    key: "bookingUpdates" | "reminders" | "promotions",
    value: boolean,
    setter: (v: boolean) => void
  ) => {
    setter(value);
    dispatch(updateNotificationPreferences({ push: { [key]: value } } as any));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await dispatch(logout());
          try {
            router.replace("/login" as any);
          } catch (e) {
            router.push("/login" as any);
          }
        },
      },
    ]);
  };

  // ─── Photo Upload Logic ─────────────────────────────────────────────────
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You need to grant access to your photos to upload a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadProfilePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploadingPhoto(true);

      const token = await auth.currentUser?.getIdToken();

      const responseData = await new Promise<any>((resolve, reject) => {
        const formData = new FormData();
        // @ts-ignore — React Native FormData accepts this object shape for files
        formData.append('profilePicture', {
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/users/profile/picture`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.message || `Upload failed with status: ${xhr.status}`));
            }
          } catch {
            reject(new Error(`Server returned an invalid response (Status: ${xhr.status}).`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error — check your connection and server URL.'));
        xhr.ontimeout = () => reject(new Error('Request timed out. Please try again.'));
        xhr.timeout = 30000;

        xhr.send(formData);
      });

      if (responseData.success) {
        // Update local state
        setProfileData((prev: any) => ({
          ...prev,
          profilePicture: responseData.data.profilePicture,
        }));

        // Update Redux state so header avatar updates immediately
        dispatch(updateUserProfile({
          profilePicture: responseData.data.profilePicture,
        }));

        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        throw new Error(responseData.message || 'Upload failed.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ─── Personal Details Logic ──────────────────────────────────────────────
  const savePersonalDetails = async () => {
    if (!personalDetails.name.trim() || !personalDetails.email.trim() || !personalDetails.phone.trim()) {
      Alert.alert("Error", "Name, Email and Phone are required");
      return;
    }

    try {
      setIsSavingPersonal(true);
      const response = await api.put('/api/users/profile', {
        name: personalDetails.name,
        email: personalDetails.email,
        phone: personalDetails.phone,
        dateOfBirth: personalDetails.dateOfBirth.toISOString()
      });

      if (response.data && response.data.success) {
        setProfileData((prev: any) => ({
          ...prev,
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone,
          dateOfBirth: response.data.data.dateOfBirth
        }));

        // Update Redux for global state
        dispatch(updateUserProfile({
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone
        }));

        Alert.alert("Success", "Personal details updated successfully");
        setIsPersonalModalVisible(false);
      }
    } catch (error: any) {
      console.error("Save personal details error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to save personal details");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // ─── Family Details Logic ───────────────────────────────────────────────
  const saveFamilyDetails = async () => {
    try {
      setIsSavingFamily(true);
      const response = await api.put('/api/users/profile', {
        familyDetails: familyDetails
      });

      if (response.data && response.data.success) {
        setProfileData((prev: any) => ({
          ...prev,
          familyDetails: response.data.data.familyDetails
        }));
        Alert.alert("Success", "Family details updated successfully");
        setIsFamilyModalVisible(false);
      }
    } catch (error: any) {
      console.error("Save family details error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to save family details");
    } finally {
      setIsSavingFamily(false);
    }
  };

  const firstName = userInfo?.name?.split(" ")[0] || "Devotee";
  const userProfilePic = profileData?.profilePicture?.url || userInfo?.profilePicture?.url;

  // Menu item helper
  const MenuItem = ({
    icon,
    label,
    onPress,
    color = APP_COLORS.saffron,
    showChevron = true,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {showChevron && <Ionicons name="chevron-forward" size={18} color={APP_COLORS.gray} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
        <Text style={{ marginTop: 10, color: APP_COLORS.gray }}>Loading your profile...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <ErrorMessage 
          message="We couldn't load your profile details." 
          onRetry={fetchProfile}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>



        {/* ── Profile Header ──────────────────────────── */}
        <LinearGradient
          colors={["#FFE5D9", "#FFF5E6"]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            {isUploadingPhoto ? (
              <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: APP_COLORS.lightGray }]}>
                <ActivityIndicator color={APP_COLORS.saffron} />
              </View>
            ) : userProfilePic ? (
              <Image
                source={{ uri: userProfilePic }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#FFD4B8', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={56} color="#E8630A" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
            >
              <Ionicons name="camera" size={14} color={APP_COLORS.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.nameRatingContainer}>
            <Text style={styles.userName}>{userInfo?.name || "Devotee"}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={APP_COLORS.white} />
              <Text style={styles.ratingText}>
                {profileData?.rating?.average?.toFixed(1) || userInfo?.rating?.average?.toFixed(1) || "5.0"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Personal Details ────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>👤 Personal Details</Text>
          <Card>
            <View style={styles.detailRow}>
              <View style={[styles.menuIconWrap, { backgroundColor: APP_COLORS.saffron + "15" }]}>
                <Ionicons name="person-outline" size={20} color={APP_COLORS.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{profileData?.name || userInfo?.name || "-"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.menuIconWrap, { backgroundColor: APP_COLORS.saffron + "15" }]}>
                <Ionicons name="mail-outline" size={20} color={APP_COLORS.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{profileData?.email || userInfo?.email || "-"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.menuIconWrap, { backgroundColor: APP_COLORS.saffron + "15" }]}>
                <Ionicons name="call-outline" size={20} color={APP_COLORS.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{profileData?.phone || userInfo?.phone || "-"}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.menuIconWrap, { backgroundColor: APP_COLORS.saffron + "15" }]}>
                <Ionicons name="calendar-outline" size={20} color={APP_COLORS.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>
                  {profileData?.dateOfBirth
                    ? new Date(profileData.dateOfBirth).toLocaleDateString()
                    : "-"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.editFamilyBtn, { marginTop: 8 }]}
              onPress={() => setIsPersonalModalVisible(true)}
            >
              <Ionicons name="create-outline" size={16} color={APP_COLORS.saffron} />
              <Text style={styles.editFamilyText}>Edit Personal Details</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* ── My Spiritual Profile ───────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔯 My Spiritual Profile</Text>
          <Card style={styles.familyCard}>
            <View style={styles.familyRow}>
              <View style={styles.familyItem}>
                <Text style={styles.familyLabel}>Gotra</Text>
                <Text style={styles.familyValue}>{familyDetails.gotra || "-"}</Text>
              </View>
              <View style={styles.familyDivider} />
              <View style={styles.familyItem}>
                <Text style={styles.familyLabel}>Nakshatra</Text>
                <Text style={styles.familyValue}>{familyDetails.nakshatra || "-"}</Text>
              </View>
              <View style={styles.familyDivider} />
              <View style={styles.familyItem}>
                <Text style={styles.familyLabel}>Rashi</Text>
                <Text style={styles.familyValue}>{familyDetails.rashi || "-"}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editFamilyBtn}
              onPress={() => setIsFamilyModalVisible(true)}
            >
              <Ionicons name="create-outline" size={16} color={APP_COLORS.saffron} />
              <Text style={styles.editFamilyText}>Edit Details</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* ── Account ─────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>⚙️ Account</Text>
          <Card>
            <MenuItem
              icon="location-outline"
              label="Saved Addresses"
              onPress={() => router.push("/(devoteeScreens)/profile/ManageAddresses")}
            />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              onPress={() => router.push("/PaymentMethods")}
            />
          </Card>
        </View>

        {/* ── Notifications ───────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <Card>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Upcoming Bookings</Text>
                <Text style={styles.toggleDesc}>Reminders for your ceremonies</Text>
              </View>
              <Switch
                value={notifyUpcoming}
                onValueChange={(v) => onToggle("bookingUpdates", v, setNotifyUpcoming)}
                trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.saffron + "60" }}
                thumbColor={notifyUpcoming ? APP_COLORS.saffron : APP_COLORS.gray}
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Booking Confirmations</Text>
                <Text style={styles.toggleDesc}>Updates on booking status</Text>
              </View>
              <Switch
                value={notifyConfirmations}
                onValueChange={(v) => onToggle("reminders", v, setNotifyConfirmations)}
                trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.saffron + "60" }}
                thumbColor={notifyConfirmations ? APP_COLORS.saffron : APP_COLORS.gray}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Promotions & News</Text>
                <Text style={styles.toggleDesc}>Special offers and updates</Text>
              </View>
              <Switch
                value={notifyPromotions}
                onValueChange={(v) => onToggle("promotions", v, setNotifyPromotions)}
                trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.saffron + "60" }}
                thumbColor={notifyPromotions ? APP_COLORS.saffron : APP_COLORS.gray}
              />
            </View>
          </Card>
        </View>

        {/* ── App ─────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ℹ️ App</Text>
          <Card>
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push("/Help")}
              color={APP_COLORS.info}
            />
            <MenuItem
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => router.push("/TermsAndConditions")}
              color={APP_COLORS.gray}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Security & Privacy"
              onPress={() => router.push("/SecurityAndPrivacy" as any)}
              color={APP_COLORS.success}
            />
          </Card>
        </View>

        {/* ── Logout ──────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={APP_COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>BookMyPujari v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Personal Details Modal ──────────────── */}
      <Modal
        visible={isPersonalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPersonalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <TouchableOpacity onPress={() => setIsPersonalModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={personalDetails.name}
                  onChangeText={(text) => setPersonalDetails({ ...personalDetails, name: text })}
                  placeholder="Enter Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={personalDetails.email}
                  onChangeText={(text) => setPersonalDetails({ ...personalDetails, email: text })}
                  placeholder="Enter Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={personalDetails.phone}
                  onChangeText={(text) => setPersonalDetails({ ...personalDetails, phone: text })}
                  placeholder="Enter Phone"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{personalDetails.dateOfBirth.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={personalDetails.dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setPersonalDetails({ ...personalDetails, dateOfBirth: selectedDate });
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePersonalDetails}
                disabled={isSavingPersonal}
              >
                {isSavingPersonal ? (
                  <ActivityIndicator color={APP_COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit Family Modal ───────────────────────── */}
      <Modal
        visible={isFamilyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFamilyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Family Details</Text>
              <TouchableOpacity onPress={() => setIsFamilyModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gotra</Text>
              <TextInput
                style={styles.input}
                value={familyDetails.gotra}
                onChangeText={(text) => setFamilyDetails({ ...familyDetails, gotra: text })}
                placeholder="Enter Gotra"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nakshatra</Text>
              <TextInput
                style={styles.input}
                value={familyDetails.nakshatra}
                onChangeText={(text) => setFamilyDetails({ ...familyDetails, nakshatra: text })}
                placeholder="Enter Nakshatra"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rashi (Zodiac)</Text>
              <TextInput
                style={styles.input}
                value={familyDetails.rashi}
                onChangeText={(text) => setFamilyDetails({ ...familyDetails, rashi: text })}
                placeholder="Enter Rashi"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveFamilyDetails}
              disabled={isSavingFamily}
            >
              {isSavingFamily ? (
                <ActivityIndicator color={APP_COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Details</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: APP_COLORS.saffron + "40",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_COLORS.saffron,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: APP_COLORS.surface,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "serif",
    color: APP_COLORS.tertiary,
  },
  nameRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.saffron,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: APP_COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.saffronLight,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
    color: APP_COLORS.saffron,
  },
  userPhone: {
    fontSize: 13,
    color: APP_COLORS.gray,
  },

  // Sections
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "serif",
    color: APP_COLORS.tertiary,
    marginBottom: 10,
    marginLeft: 2,
  },

  // Family Card
  familyCard: {
    paddingBottom: 8,
  },
  familyRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  familyItem: {
    alignItems: "center",
    flex: 1,
  },
  familyLabel: {
    fontSize: 11,
    color: APP_COLORS.gray,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  familyValue: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    textAlign: 'center',
  },
  familyDivider: {
    width: 1,
    backgroundColor: APP_COLORS.divider,
  },
  editFamilyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.divider,
  },
  editFamilyText: {
    fontSize: 13,
    fontWeight: "600",
    color: APP_COLORS.saffron,
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: APP_COLORS.bodyText,
  },

  // Toggle Rows
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: APP_COLORS.bodyText,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: APP_COLORS.error + "40",
    backgroundColor: APP_COLORS.error + "08",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.error,
  },

  // Version
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.bodyText,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: APP_COLORS.divider,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: APP_COLORS.background,
  },
  saveButton: {
    backgroundColor: APP_COLORS.saffron,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: APP_COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Personal Details Rows
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
  },
  detailLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: APP_COLORS.headingText,
    fontWeight: "500",
  },
});

export default ProfileScreen;
