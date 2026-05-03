import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getToken, removeToken } from "../../../utils/storage";
import { API_BASE_URL } from "../../../api";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { logout } from "../../../redux/slices/authSlice";
import { RootState } from "../../../redux/store";
import priestService from "../../../services/priestService";
import RatingStars from "../../../components/RatingStars";

interface PriestProfile {
  experience?: number;
  religiousTradition?: string;
  ceremonies?: any[];
  services?: any[];
  availability?: any;
  templesAffiliated?: any[];
  [key: string]: any;
}

const menuStyles = StyleSheet.create({
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: APP_COLORS.gray,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  menuSectionBox: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.lightGray,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_COLORS.primary + '1A',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: APP_COLORS.tertiary,
    fontWeight: "600",
    fontFamily: 'serif',
  },
  rightText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 8,
  }
});

const MenuItem = ({ icon, label, onPress, destructive = false, rightText = "", isLast = false }: any) => (
  <TouchableOpacity style={[menuStyles.menuItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={menuStyles.menuItemLeft}>
      <View style={[menuStyles.iconContainer, destructive && { backgroundColor: APP_COLORS.error + '1A' }]}>
        <Ionicons name={icon} size={20} color={destructive ? APP_COLORS.error : APP_COLORS.primary} />
      </View>
      <Text style={[menuStyles.menuItemLabel, destructive && { color: APP_COLORS.error }]}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {rightText ? <Text style={menuStyles.rightText}>{rightText}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={APP_COLORS.gray} />
    </View>
  </TouchableOpacity>
);

const MenuSection = ({ title, children }: any) => (
  <View style={menuStyles.menuSection}>
    <Text style={menuStyles.menuSectionTitle}>{title.toUpperCase()}</Text>
    <View style={menuStyles.menuSectionBox}>
      {children}
    </View>
  </View>
);

const HEADER_TOP_PADDING = (StatusBar.currentHeight ?? 24) + 20;

const ProfileScreen: React.FC = () => {
  // ... existing hooks ...
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<PriestProfile | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- UI Refactor State ---
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDocsModalVisible, setIsDocsModalVisible] = useState(false);
  const [isReviewsModalVisible, setIsReviewsModalVisible] = useState(false);
  
  const [isPersonalModalVisible, setIsPersonalModalVisible] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({ name: "", email: "", phone: "", experience: "", religiousTradition: "", description: "", serviceRadiusKm: "" });
  const [addressDetails, setAddressDetails] = useState({ houseNo: "", street: "", town: "", state: "", country: "India", pincode: "", fullAddress: "" });
  
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [isTempleModalVisible, setIsTempleModalVisible] = useState(false);
  const [isSavingTemple, setIsSavingTemple] = useState(false);
  const [templeDetails, setTempleDetails] = useState([{ name: "", address: "" }]);


  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getProfile();
    }, [])
  );

  const getProfile = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const priestProfile = await priestService.getProfile();
      setProfile(priestProfile);
      if (userInfo) {
        setPersonalDetails(prev => ({
          ...prev,
          name: userInfo.name || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
        }));
      }
      if (priestProfile) {
        setPersonalDetails(prev => ({
          ...prev,
          experience: priestProfile.experience?.toString() || "",
          religiousTradition: priestProfile.religiousTradition || "",
          serviceRadiusKm: priestProfile.serviceRadiusKm?.toString() || "10",
          description: priestProfile.description || ""
        }));
        setAddressDetails({
          houseNo: priestProfile.address?.houseNo || "",
          street: priestProfile.address?.street || "",
          town: priestProfile.address?.town || "",
          state: priestProfile.address?.state || "",
          country: priestProfile.address?.country || "India",
          pincode: priestProfile.address?.pincode || "",
          fullAddress: priestProfile.address?.fullAddress || (typeof priestProfile.address === 'string' ? priestProfile.address : "")
        });
        setTempleDetails(priestProfile.templesAffiliated?.length ? [...priestProfile.templesAffiliated] : [{ name: "", address: "" }]);
      }

      // Fetch profile completion from backend
      try {
        const completion = await priestService.getProfileCompletion();
        setProfileCompletion(completion?.completionPercentage || 0);
      } catch (err) {
        console.warn("Profile completion fetch failed:", err);
        setProfileCompletion(0);
      }

      // Fetch user reviews
      if (userInfo?._id) {
        try {
          const reviews = await priestService.getUserReviews(userInfo._id);
          setUserReviews(reviews);
        } catch (err) {
          console.warn("User reviews fetch failed:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (isManualRefresh) {
        Alert.alert("Error", "Failed to refresh profile");
      }
    } finally {
      setRefreshing(false);
    }
  }, [userInfo?._id]);

  const onRefresh = useCallback(() => {
    getProfile(true);
  }, [getProfile]);

  const handleLogout = (): void => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await removeToken("userToken");
            await removeToken("userInfo");
            await dispatch(logout() as any);
            try { router.replace("/login" as any); } catch (e) { router.push("/login" as any); }
          },
        },
      ],
      { cancelable: false }
    );
  };


  // ─── Photo Upload Logic ─────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You need to grant access to your photos to upload a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
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

      const fileData = {
        uri: asset.uri,
        name: asset.fileName || "profile.jpg",
        type: asset.mimeType || "image/jpeg"
      };

      await priestService.uploadDocument(fileData, 'profile_picture');
      
      // Update Redux state 
      dispatch({ type: 'auth/updateProfile', payload: { profilePicture: asset.uri } } as any);
      getProfile(true);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error.toString() || "Failed to upload profile picture");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ─── Save Personal Details ──────────────────────────────────────────────
  const savePersonalDetails = async () => {
    if (!personalDetails.name.trim() || !personalDetails.email.trim() || !personalDetails.phone.trim()) {
      Alert.alert("Error", "Name, Email and Phone are required");
      return;
    }
    try {
      setIsSavingPersonal(true);
      
      const payload = {
        experience: parseInt(personalDetails.experience, 10) || 0,
        religiousTradition: personalDetails.religiousTradition,
        description: personalDetails.description,
        serviceRadiusKm: parseInt(personalDetails.serviceRadiusKm, 10) || 10,
      };

      await priestService.updateProfile(payload);
      
      // Since Name, Email, Phone might need to be updated in User profile, 
      // dispatch them to redux or update via API if your priestService supports it.
      // (Using standard dispatch here)
      dispatch({ type: 'auth/updateProfile', payload: { 
        name: personalDetails.name, 
        email: personalDetails.email, 
        phone: personalDetails.phone 
      } } as any);

      Alert.alert("Success", "Personal details updated");
      setIsPersonalModalVisible(false);
      getProfile(true);
    } catch (error: any) {
      Alert.alert("Error", error.toString() || "Failed to save details");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const saveAddressDetails = async () => {
    try {
      setIsSavingAddress(true);
      
      const parts = [
        addressDetails.houseNo,
        addressDetails.street,
        addressDetails.town,
        addressDetails.state,
        addressDetails.country,
        addressDetails.pincode
      ].filter(Boolean);
      
      const fullAddress = parts.join(", ");
      
      const payload = {
        address: {
          ...addressDetails,
          fullAddress
        }
      };

      await priestService.updateProfile(payload);
      
      Alert.alert("Success", "Business address updated");
      setIsAddressModalVisible(false);
      getProfile(true);
    } catch (error: any) {
      Alert.alert("Error", error.toString() || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // ─── Save Temple Details ──────────────────────────────────────────────
  const saveTempleDetails = async () => {
    const validTemples = templeDetails.filter((t: any) => t.name && t.address);
    if (validTemples.length === 0 && templeDetails.length > 0 && (templeDetails[0].name || templeDetails[0].address)) {
        Alert.alert("Validation Error", "Please provide both name and address for the temple, or remove it.");
        return;
    }

    try {
      setIsSavingTemple(true);
      await priestService.updateProfile({ templesAffiliated: validTemples });
      Alert.alert("Success", "Temple affiliation updated");
      setIsTempleModalVisible(false);
      getProfile(true);
    } catch (error: any) {
      Alert.alert("Error", error.toString() || "Failed to update temples");
    } finally {
      setIsSavingTemple(false);
    }
  };

  const handleUpdateProfile = (): void => {
    router.push({ pathname: "/priest/ProfileSetup", params: { isEditing: true } } as any);
  };


  const handleFileUpload = async (type: "government_id" | "religious_certificate") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"], // PDF only for verification documents
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets![0];

      // Validate file type
      if (!file.mimeType?.includes('pdf')) {
        Alert.alert("Invalid File", "Please upload a PDF file only.");
        return;
      }

      setUploadingDoc(true);

      await priestService.uploadDocument(
        { uri: file.uri, name: file.name, type: "application/pdf" },
        type
      );

      setUploadingDoc(false);
      Alert.alert("Success", "Document uploaded successfully!");
      getProfile();
    } catch (error: any) {
      setUploadingDoc(false);
      Alert.alert("Error", error.toString());
    }
  };

  const handleViewDocument = async (type: "government_id" | "religious_certificate") => {
    const doc = profile?.verificationDocuments?.find((d: any) => d.type === type);
    if (doc) {
      try {
        setDownloadingDoc(true);

        // Get token from storage
        const token = await getToken('userToken');

        if (!token) {
          setDownloadingDoc(false);
          Alert.alert("Error", "Please login again to view documents");
          return;
        }

        const baseUrl = API_BASE_URL;
        const fileName = doc.fileName || `${type}.pdf`;
        // Ensure unique filename to avoid caching issues
        const uniqueFileName = `${Date.now()}_${fileName}`;
        const fileUri = `${FileSystem.documentDirectory}${uniqueFileName}`;

        // Download with auth header
        const downloadResult = await FileSystem.downloadAsync(
          `${baseUrl}/api/priest/documents/${type}`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDownloadingDoc(false);

        if (downloadResult.status === 200) {
          // Check if the file was downloaded correctly
          const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
          console.log("Downloaded file info:", fileInfo);

          if (!fileInfo.exists || (fileInfo as any).size === 0) {
            Alert.alert("Error", "Downloaded file is empty");
            return;
          }

          // Get content URI for sharing with other apps
          const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
          console.log("Content URI:", contentUri);

          // Try to open using IntentLauncher (Android) for direct PDF viewing
          try {
            const IntentLauncher = require('expo-intent-launcher');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
              type: 'application/pdf',
            });
          } catch (intentError) {
            // IntentLauncher not available or failed, try Linking
            console.log("IntentLauncher failed, trying Linking:", intentError);
            const canOpen = await Linking.canOpenURL(contentUri);
            if (canOpen) {
              await Linking.openURL(contentUri);
            } else {
              Alert.alert("Error", "No PDF viewer app found. Please install a PDF reader.");
            }
          }
        } else {
          Alert.alert("Error", `Failed to download document (Status: ${downloadResult.status})`);
        }
      } catch (error: any) {
        setDownloadingDoc(false);
        console.error("View document error:", error);
        Alert.alert("Error", error.message || "Could not open document");
      }
    } else {
      Alert.alert("No Document", "No document has been uploaded yet.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Loading Modal for PDF Upload/Download */}
      <Modal
        transparent={true}
        visible={downloadingDoc || uploadingDoc}
        animationType="fade"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={APP_COLORS.primary} />
            <Text style={{ marginTop: 12, fontSize: 16, color: '#333' }}>
              {uploadingDoc ? 'Uploading document...' : 'Downloading document...'}
            </Text>
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <LinearGradient 
            colors={['#FFFFFF', '#FDFBF7']} 
            style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 16, paddingBottom: 24 }]}
          >
            <Text style={styles.headerTitle}>My Profile</Text>
          </LinearGradient>

          <View style={styles.profileHeader}>
            <Image
              source={profile?.profilePicture ? { uri: profile.profilePicture } : require("../../../assets/images/default-profile.png")}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editProfileButton} onPress={handlePickPhoto}>
              <Ionicons name="camera-outline" size={20} color={APP_COLORS.white} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.userName}>{userInfo?.name || "Pandit Sharma"}</Text>
              {profile?.isVerified && (
                <View style={{ marginLeft: 6, backgroundColor: APP_COLORS.primary, borderRadius: 10, padding: 1 }}>
                  <Ionicons name="checkmark-circle" size={18} color={APP_COLORS.white} />
                </View>
              )}
            </View>

            {/* Overall Rating */}
            {(profile?.userId as any)?.rating?.count > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginRight: 4 }}>
                  {(profile?.userId as any)?.rating?.average?.toFixed(1)}
                </Text>
                <RatingStars rating={(profile?.userId as any)?.rating?.average} size={16} readOnly />
                <Text style={{ fontSize: 14, color: APP_COLORS.gray, marginLeft: 4 }}>
                  ({(profile?.userId as any)?.rating?.count} reviews)
                </Text>
              </View>
            )}

            <Text style={styles.userRole}>Priest • {(profile?.experience as any) || 0} years experience</Text>

            {profileCompletion < 100 && (
              <View style={styles.completionContainer}>
                <View style={styles.completionBar}>
                  <View style={[styles.completionProgress, { width: `${profileCompletion}%` }]} />
                </View>
                <Text style={styles.completionText}>Profile {profileCompletion}% Complete</Text>
              </View>
            )}
          </View>

          {/* Menu Sections */}
          <MenuSection title="Account & Profile">
            <MenuItem 
                icon="person-outline" 
                label="Personal Details" 
                rightText={profileCompletion < 100 ? "Incomplete" : ""}
                onPress={() => setIsPersonalModalVisible(true)} 
            />
            <MenuItem 
                icon="location-outline" 
                label="Business Address" 
                rightText={addressDetails.fullAddress ? (addressDetails.fullAddress.length > 15 ? addressDetails.fullAddress.substring(0, 12) + "..." : addressDetails.fullAddress) : "Not Set"}
                onPress={() => setIsAddressModalVisible(true)} 
            />
            <MenuItem 
                icon="business-outline" 
                label="Temple Affiliations" 
                rightText={`${profile?.templesAffiliated?.length || 0} Added`}
                onPress={() => setIsTempleModalVisible(true)} 
            />
            <MenuItem 
                icon="document-text-outline" 
                label="Verification Documents" 
                rightText={profile?.isVerified ? "Verified" : (profile?.verificationStatus === 'pending' ? "Pending Approval" : (profile?.verificationStatus === 'rejected' ? "Action Required" : "Incomplete"))}
                onPress={() => setIsDocsModalVisible(true)} 
                isLast={true}
            />
          </MenuSection>

          <MenuSection title="Business & Schedule">
            <MenuItem 
                icon="calendar-outline" 
                label="Availability" 
                onPress={() => router.push("/priest/AvailabilitySetup" as any)} 
            />
            <MenuItem 
                icon="star-outline" 
                label="My Reviews" 
                rightText={`${userReviews.length} Reviews`}
                onPress={() => setIsReviewsModalVisible(true)} 
                isLast={true}
            />
          </MenuSection>

          <MenuSection title="Settings & Support">
            <MenuItem 
                icon="notifications-outline" 
                label="Notifications" 
                onPress={() => { Alert.alert("Coming Soon", "Notification preferences will be available soon.") }} 
            />
            <MenuItem 
                icon="help-circle-outline" 
                label="Help Center" 
                onPress={() => { Linking.openURL("mailto:support@sacredconnect.com") }} 
            />
            <MenuItem 
                icon="log-out-outline" 
                label="Logout" 
                destructive={true} 
                onPress={handleLogout} 
                isLast={true}
            />
          </MenuSection>

        </ScrollView>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={APP_COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* --- Documents Modal --- */}
      <Modal visible={isDocsModalVisible} transparent={true} animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
             <View style={localStyles.modalHeader}>
               <Text style={localStyles.modalTitle}>Verification Documents</Text>
               <TouchableOpacity onPress={() => setIsDocsModalVisible(false)}>
                 <Ionicons name="close" size={24} color={APP_COLORS.gray} />
               </TouchableOpacity>
             </View>
             <ScrollView showsVerticalScrollIndicator={false}>
          {profile?.isVerified ? (
            <View style={[styles.documentsCard, { alignItems: 'center', paddingVertical: 24 }]}>
              <Ionicons name="checkmark-circle" size={48} color={APP_COLORS.success} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: APP_COLORS.success }}>Account Verified</Text>
              <Text style={{ fontSize: 14, color: APP_COLORS.gray, textAlign: 'center', marginTop: 8 }}>
                Your identity and religious certifications have been successfully verified by Sacred Connect.
              </Text>
            </View>
          ) : (
          <View style={styles.documentsCard}>
            <View style={styles.documentItem}>
              <View style={styles.documentIconContainer}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={APP_COLORS.gray}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>Government ID</Text>
                <Text style={styles.documentStatus}>
                  {profile?.verificationDocuments?.find((d: any) => d.type === "government_id") ? "Uploaded" : "Upload Government ID"}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {profile?.verificationDocuments?.find((d: any) => d.type === "government_id") && (
                  <TouchableOpacity style={[styles.uploadButton, { backgroundColor: APP_COLORS.primary }]} onPress={() => handleViewDocument("government_id")}>
                    <Text style={styles.uploadButtonText}>View</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={() => handleFileUpload("government_id")}>
                  <Text style={styles.uploadButtonText}>
                    {profile?.verificationDocuments?.find((d: any) => d.type === "government_id") ? "Re-upload" : "Upload PDF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.documentItem}>
              <View style={styles.documentIconContainer}>
                <Ionicons
                  name="ribbon-outline"
                  size={24}
                  color={APP_COLORS.gray}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  Religious Certification
                </Text>
                <Text style={styles.documentStatus}>
                  {profile?.verificationDocuments?.find((d: any) => d.type === "religious_certificate") ? "Uploaded" : "Upload Certification"}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {profile?.verificationDocuments?.find((d: any) => d.type === "religious_certificate") && (
                  <TouchableOpacity style={[styles.uploadButton, { backgroundColor: APP_COLORS.primary }]} onPress={() => handleViewDocument("religious_certificate")}>
                    <Text style={styles.uploadButtonText}>View</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={() => handleFileUpload("religious_certificate")}>
                  <Text style={styles.uploadButtonText}>
                    {profile?.verificationDocuments?.find((d: any) => d.type === "religious_certificate") ? "Re-upload" : "Upload PDF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          )}
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- Reviews Modal --- */}
      <Modal visible={isReviewsModalVisible} transparent={true} animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
             <View style={localStyles.modalHeader}>
               <Text style={localStyles.modalTitle}>Reviews ({userReviews.length})</Text>
               <TouchableOpacity onPress={() => setIsReviewsModalVisible(false)}>
                 <Ionicons name="close" size={24} color={APP_COLORS.gray} />
               </TouchableOpacity>
             </View>
             <ScrollView showsVerticalScrollIndicator={false}>
          {userReviews.length > 0 ? (
            <View style={styles.infoCard}>
              {userReviews.map((review, index) => (
                <View key={index} style={{ marginBottom: 16, borderBottomWidth: index < userReviews.length - 1 ? 1 : 0, borderBottomColor: APP_COLORS.lightGray, paddingBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontWeight: 'bold' }}>{review.reviewerId?.name || "User"}</Text>
                    <Text style={{ fontSize: 12, color: APP_COLORS.gray }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <RatingStars rating={review.rating} size={14} readOnly style={{ marginBottom: 4 }} />
                  <Text style={{ color: APP_COLORS.gray, fontStyle: 'italic' }}>"{review.comment}"</Text>
                  {review.tags && review.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 }}>
                      {review.tags.map((tag: string, i: number) => (
                        <View key={i} style={{ backgroundColor: APP_COLORS.lightGray, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, color: APP_COLORS.primary }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={{ textAlign: 'center', color: APP_COLORS.gray, padding: 16 }}>No reviews yet</Text>
            </View>
          )}
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- Address Details Modal --- */}
      <Modal visible={isAddressModalVisible} transparent={true} animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Edit Business Address</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={localStyles.inputLabel}>House / Flat No.</Text>
              <TextInput style={localStyles.input} value={addressDetails.houseNo} onChangeText={(text) => setAddressDetails({ ...addressDetails, houseNo: text })} placeholder="e.g. 123, Block A" />
              
              <Text style={localStyles.inputLabel}>Street / Area</Text>
              <TextInput style={localStyles.input} value={addressDetails.street} onChangeText={(text) => setAddressDetails({ ...addressDetails, street: text })} placeholder="e.g. Temple Road" />
              
              <Text style={localStyles.inputLabel}>Town / City</Text>
              <TextInput style={localStyles.input} value={addressDetails.town} onChangeText={(text) => setAddressDetails({ ...addressDetails, town: text })} placeholder="e.g. Varanasi" />

              <Text style={localStyles.inputLabel}>State</Text>
              <TextInput style={localStyles.input} value={addressDetails.state} onChangeText={(text) => setAddressDetails({ ...addressDetails, state: text })} placeholder="e.g. Uttar Pradesh" />

              <Text style={localStyles.inputLabel}>Country</Text>
              <TextInput style={localStyles.input} value={addressDetails.country} onChangeText={(text) => setAddressDetails({ ...addressDetails, country: text })} />

              <Text style={localStyles.inputLabel}>Pincode</Text>
              <TextInput style={localStyles.input} value={addressDetails.pincode} onChangeText={(text) => setAddressDetails({ ...addressDetails, pincode: text })} keyboardType="numeric" placeholder="e.g. 221001" />

              <TouchableOpacity style={localStyles.saveButton} onPress={saveAddressDetails} disabled={isSavingAddress}>
                {isSavingAddress ? <ActivityIndicator color={APP_COLORS.white} /> : <Text style={localStyles.saveButtonText}>Save Address</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- Personal Details Modal --- */}
      <Modal visible={isPersonalModalVisible} transparent={true} animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Edit Details</Text>
              <TouchableOpacity onPress={() => setIsPersonalModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={localStyles.inputLabel}>Full Name</Text>
              <TextInput style={localStyles.input} value={personalDetails.name} onChangeText={(text) => setPersonalDetails({ ...personalDetails, name: text })} />
              
              <Text style={localStyles.inputLabel}>Email</Text>
              <TextInput style={localStyles.input} value={personalDetails.email} onChangeText={(text) => setPersonalDetails({ ...personalDetails, email: text })} keyboardType="email-address" />
              
              <Text style={localStyles.inputLabel}>Phone (readonly)</Text>
              <TextInput style={[localStyles.input, { backgroundColor: APP_COLORS.lightGray }]} value={personalDetails.phone} editable={false} />

              <Text style={localStyles.inputLabel}>Experience (Years)</Text>
              <TextInput style={localStyles.input} value={personalDetails.experience} onChangeText={(text) => setPersonalDetails({ ...personalDetails, experience: text })} keyboardType="numeric" />

              <Text style={localStyles.inputLabel}>Religious Tradition</Text>
              <TextInput style={localStyles.input} value={personalDetails.religiousTradition} onChangeText={(text) => setPersonalDetails({ ...personalDetails, religiousTradition: text })} />

              <Text style={localStyles.inputLabel}>Service Radius (Km)</Text>
              <TextInput style={localStyles.input} value={personalDetails.serviceRadiusKm} onChangeText={(text) => setPersonalDetails({ ...personalDetails, serviceRadiusKm: text })} keyboardType="numeric" />

              <Text style={localStyles.inputLabel}>Bio / Description</Text>
              <TextInput style={[localStyles.input, { height: 80, textAlignVertical: "top" }]} multiline value={personalDetails.description} onChangeText={(text) => setPersonalDetails({ ...personalDetails, description: text })} />

              <TouchableOpacity style={localStyles.saveButton} onPress={savePersonalDetails} disabled={isSavingPersonal}>
                {isSavingPersonal ? <ActivityIndicator color={APP_COLORS.white} /> : <Text style={localStyles.saveButtonText}>Save Changes</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- Temple Affiliation Modal --- */}
      <Modal visible={isTempleModalVisible} transparent={true} animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Edit Temples</Text>
              <TouchableOpacity onPress={() => setIsTempleModalVisible(false)}>
                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {templeDetails.map((temple, idx) => (
                <View key={idx} style={{ marginBottom: 16, padding: 12, borderWidth: 1, borderColor: APP_COLORS.lightGray, borderRadius: 8 }}>
                  <Text style={localStyles.inputLabel}>Temple Name</Text>
                  <TextInput style={localStyles.input} value={temple.name} onChangeText={(val) => {
                    const newT = [...templeDetails];
                    newT[idx].name = val;
                    setTempleDetails(newT);
                  }} />
                  <Text style={localStyles.inputLabel}>Temple Address</Text>
                  <TextInput style={localStyles.input} value={temple.address} onChangeText={(val) => {
                    const newT = [...templeDetails];
                    newT[idx].address = val;
                    setTempleDetails(newT);
                  }} />
                  <TouchableOpacity onPress={() => {
                    const newT = [...templeDetails];
                    newT.splice(idx, 1);
                    setTempleDetails(newT.length ? newT : [{ name: "", address: "" }]);
                  }}>
                    <Text style={{ color: APP_COLORS.error, marginTop: 4 }}>Remove Temple</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity style={{ marginBottom: 20, alignItems: "center" }} onPress={() => setTempleDetails([...templeDetails, { name: "", address: "" }])}>
                <Text style={{ color: APP_COLORS.primary, fontWeight: "bold" }}>+ Add Another Temple</Text>
              </TouchableOpacity>

              <TouchableOpacity style={localStyles.saveButton} onPress={saveTempleDetails} disabled={isSavingTemple}>
                {isSavingTemple ? <ActivityIndicator color={APP_COLORS.white} /> : <Text style={localStyles.saveButtonText}>Save Changes</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Loading Modal for Uploading Photo */}
      <Modal transparent={true} visible={isUploadingPhoto} animationType="fade">
        <View style={localStyles.modalOverlay}>
            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={APP_COLORS.primary} />
              <Text style={{ marginTop: 12, fontSize: 16, color: '#333' }}>Updating photo...</Text>
            </View>
        </View>
      </Modal>

    </View>
  );
};

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: "60%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.tertiary,
    fontFamily: 'serif',
  },
  inputLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: 'serif',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: APP_COLORS.tertiary,
    shadowOpacity: 0.06,
    elevation: 3,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: APP_COLORS.tertiary,
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: "bold",
    marginLeft: 20,
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  editProfileButton: {
    position: "absolute",
    top: 96,
    right: "50%",
    marginRight: -50,
    backgroundColor: APP_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: APP_COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: 'serif',
    color: APP_COLORS.tertiary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 16,
  },
  completionContainer: {
    width: "100%",
    alignItems: "center",
  },
  completionBar: {
    width: "100%",
    height: 6,
    backgroundColor: APP_COLORS.lightGray,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  completionProgress: {
    height: "100%",
    backgroundColor: APP_COLORS.primary,
    borderRadius: 3,
  },
  completionText: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: APP_COLORS.saffronLight,
  },
  editButtonText: {
    fontSize: 12,
    color: APP_COLORS.primary,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  templeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.tertiary,
    marginBottom: 2,
    fontFamily: 'serif',
  },
  infoValue: {
    fontSize: 16,
  },
  templeAddress: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  documentsCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  uploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  uploadButtonText: {
    fontSize: 12,
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.error,
  },
  logoutButtonText: {
    marginLeft: 8,
    color: APP_COLORS.error,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
