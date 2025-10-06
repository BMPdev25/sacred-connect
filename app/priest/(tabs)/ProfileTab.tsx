import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { APP_COLORS } from "../../../constants/Colors";
import { logout } from "../../../redux/slices/authSlice";
import { RootState } from "../../../redux/store";

const HEADER_TOP_PADDING = Platform.OS === "android" ? 24 : 44;

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  console.log("User Info:", userInfo);
  const profile = (userInfo as any)?.profile;

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    if (!userInfo) return 0;

    let completed = 0;
    const totalFields = 6;

    if (userInfo.name) completed++;
    if (userInfo.email) completed++;
    if (userInfo.phone) completed++;
    const profile = (userInfo as any)?.profile;
    if (profile?.experience) completed++;
    if (profile?.religiousTradition) completed++;
    if (profile?.ceremonies && profile.ceremonies.length > 0) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const handleLogout = (): void => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            // dispatch logout thunk which clears AsyncStorage and auth state
            await dispatch(logout() as any);
            // replace navigation stack to login
            try {
              router.replace("/login" as any);
            } catch (e) {
              // fallback: attempt push
              router.push("/login" as any);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleUpdateProfile = (): void => {
    router.push("/ProfileSetup");
  };

  return (
    <SafeAreaView style={styles.container}>
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
              borderBottomWidth: 1,
              borderBottomColor: APP_COLORS.lightGray,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={() => router.push("/Help")}>
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={APP_COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>

  <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.profileHeader}>
            <Image
              source={require("../../../assets/images/default-profile.png")}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleUpdateProfile}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={APP_COLORS.white}
              />
            </TouchableOpacity>
            <Text style={styles.userName}>
              {userInfo?.name || "Pandit Sharma"}
            </Text>
            <Text style={styles.userRole}>
              Senior Priest • {(profile?.experience as any) || 12} years
              experience
            </Text>

            <View style={styles.completionContainer}>
              <View style={styles.completionBar}>
                <View
                  style={[
                    styles.completionProgress,
                    {
                      width: `${profileCompletion}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.completionText}>
                Profile {profileCompletion}% Complete
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>
                {userInfo?.name || "Pandit Sharma"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Years of Experience</Text>
              <Text style={styles.infoValue}>12</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Religious Tradition</Text>
              <Text style={styles.infoValue}>Hinduism</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Documents</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.editButtonText}>Upload</Text>
            </TouchableOpacity>
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
                <Text style={styles.documentStatus}>Upload Government ID</Text>
              </View>
              <TouchableOpacity style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
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
                <Text style={styles.documentStatus}>Upload Certification</Text>
              </View>
              <TouchableOpacity style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temple Affiliation</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Temple Name</Text>
              <Text style={styles.infoValue}>Enter temple name</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Temple Address</Text>
              <Text style={styles.infoValue}>Enter temple address</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleUpdateProfile}
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
    </SafeAreaView>
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
    // Top padding is now handled dynamically
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
  infoValue: {
    fontSize: 16,
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
