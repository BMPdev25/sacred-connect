import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { logout } from "../../../redux/slices/authSlice";
import { RootState } from "../../../redux/store";
import priestService from "../../../services/priestService";

interface PriestProfile {
  experience?: number;
  religiousTradition?: string;
  ceremonies?: any[];
  services?: any[];
  availability?: any;
  templesAffiliated?: any[];
  [key: string]: any;
}

const HEADER_TOP_PADDING = (StatusBar.currentHeight ?? 24) + 20;

const ProfileScreen: React.FC = () => {
  // ... existing hooks ...
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<PriestProfile | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getProfile();
    }, [])
  );

  const getProfile = async () => {
    try {
      const priestProfile = await priestService.getProfile();
      setProfile(priestProfile);

      // Fetch profile completion from backend
      try {
        const completion = await priestService.getProfileCompletion();
        setProfileCompletion(completion?.completionPercentage || 0);
      } catch (err) {
        console.warn("Profile completion fetch failed:", err);
        setProfileCompletion(0);
      }
    } catch (err) {
      console.error("Error fetching profile on mount:", err);
    }
  };

  const handleLogout = (): void => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await dispatch(logout() as any);
            try { router.replace("/login" as any); } catch (e) { router.push("/login" as any); }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleUpdateProfile = (): void => {
    router.push({ pathname: "/ProfileSetup", params: { isEditing: true } } as any);
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

        // Get token from SecureStore
        const SecureStore = require('expo-secure-store');
        const token = await SecureStore.getItemAsync('userToken');

        if (!token) {
          setDownloadingDoc(false);
          Alert.alert("Error", "Please login again to view documents");
          return;
        }

        const baseUrl = "http://192.168.29.44:5000";
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
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* ... Header ... */}
          {/* ... Header ... */}
          <View style={styles.profileHeader}>
            <Image
              source={profile?.profilePicture ? { uri: profile.profilePicture } : require("../../../assets/images/default-profile.png")}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editProfileButton} onPress={handleUpdateProfile}>
              <Ionicons name="camera-outline" size={20} color={APP_COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.userName}>{userInfo?.name || "Pandit Sharma"}</Text>
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

          {/* Personal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({ pathname: "/ProfileSetup", params: { isEditing: true, jumpToStep: 1, section: 'personalDetails' } } as any)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{userInfo?.name || "Pandit Sharma"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Years of Experience</Text>
              <Text style={styles.infoValue}>{profile?.experience || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Religious Tradition</Text>
              <Text style={styles.infoValue}>{profile?.religiousTradition || "Tradition"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Languages Spoken</Text>
              <Text style={styles.infoValue}>
                <Text style={styles.infoValue}>
                  {(() => {
                    const langs = profile?.userId?.languagesSpoken;
                    if (!langs || langs.length === 0) return 'Not specified';
                    if (typeof langs[0] === 'object') {
                      return langs.map((l: any) => l.name || JSON.stringify(l)).join(', ');
                    }
                    return langs.join(', ');
                  })()}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{profile?.description || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {profile?.address
                  ? profile.address
                  : profile?.location && profile.location.coordinates[0] !== 0
                    ? `Lat: ${profile.location.coordinates[1].toFixed(4)}, Lng: ${profile.location.coordinates[0].toFixed(4)}`
                    : 'Not set'}
              </Text>
            </View>
          </View>

          {/* Services moved to ServicesTab */}

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({ pathname: "/ProfileSetup", params: { isEditing: true, jumpToStep: 4 } } as any)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            {profile?.availability ? (
              Object.entries(profile.availability).map(([day, slots]: [string, any]) => {
                // Availability is stored as an array of slots per day. We currently use only the first slot.
                const data = Array.isArray(slots) ? slots[0] : slots;
                if (!data || !data.available) return null;
                return (
                  <View style={[styles.infoRow, { flexDirection: 'row', justifyContent: 'space-between' }]} key={day}>
                    <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{day}</Text>
                    <Text style={styles.infoLabel}>{data.startTime} - {data.endTime}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>Availability not set</Text>
              </View>
            )}
            {/* Show "No availability" if all days are false or object is empty/null, but map handles empty render effectively. 
                Could add a check if needed, but this is sufficient for now. 
            */}
          </View>

          {/* Verification Documents */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Documents</Text>
          </View>

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
                  <TouchableOpacity style={[styles.uploadButton, { backgroundColor: APP_COLORS.info }]} onPress={() => handleViewDocument("government_id")}>
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
                  <TouchableOpacity style={[styles.uploadButton, { backgroundColor: APP_COLORS.info }]} onPress={() => handleViewDocument("religious_certificate")}>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({ pathname: "/ProfileSetup", params: { isEditing: true, jumpToStep: 3 } } as any)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            {profile?.templesAffiliated &&
              profile.templesAffiliated.length > 0 ? (
              profile.templesAffiliated.map((temple: any, idx: number) => (
                <View style={styles.infoRow} key={`temple-${idx}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Temple {idx + 1}</Text>
                    <Text style={[styles.infoLabel, styles.templeName]}>
                      {temple.name || "Temple"}
                    </Text>
                    <Text style={[styles.infoValue, styles.templeAddress]}>
                      {temple.address || "Address not provided"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>
                  No temple affiliations added
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push({ pathname: "/ProfileSetup", params: { isEditing: true, jumpToStep: 1, section: 'contactInfo' } } as any)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>
                {userInfo?.phone || "+91 XXXXX XXXXX"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {userInfo?.email || "example@email.com"}
              </Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={APP_COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
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
  header: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 22,
    fontWeight: "bold",
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
    backgroundColor: "rgba(255, 107, 0, 0.2)",
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
    color: APP_COLORS.black,
    marginBottom: 2,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary,
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
