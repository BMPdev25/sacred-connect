import re
import os

filepath = r"c:\Users\pgopa\OneDrive\Documents\GitHub\sacred-connect\app\priest\(tabs)\ProfileTab.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if 'import * as ImagePicker from "expo-image-picker";' not in content:
    content = content.replace('import { router, useFocusEffect } from "expo-router";', 'import { router, useFocusEffect } from "expo-router";\nimport * as ImagePicker from "expo-image-picker";')

if 'TextInput' not in content:
    content = content.replace('TouchableOpacity,\n  View,\n  RefreshControl', 'TouchableOpacity,\n  View,\n  RefreshControl,\n  TextInput')

# 2. State hooks
state_hooks_replacement = """  const [refreshing, setRefreshing] = useState(false);

  // --- UI Refactor State ---
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const [isPersonalModalVisible, setIsPersonalModalVisible] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({ name: "", email: "", phone: "", experience: "", religiousTradition: "", description: "" });

  const [isTempleModalVisible, setIsTempleModalVisible] = useState(false);
  const [isSavingTemple, setIsSavingTemple] = useState(false);
  const [templeDetails, setTempleDetails] = useState([{ name: "", address: "" }]);
"""
content = re.sub(r'  const \[refreshing, setRefreshing\] = useState\(false\);', state_hooks_replacement, content)

# 3. Populate state in getProfile
content = content.replace("setProfile(priestProfile);", """setProfile(priestProfile);
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
          description: priestProfile.description || ""
        }));
        setTempleDetails(priestProfile.templesAffiliated?.length ? [...priestProfile.templesAffiliated] : [{ name: "", address: "" }]);
      }""")

# 4. Add handlers
handlers_code = """
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
"""
content = re.sub(r'  const handleUpdateProfile = \(\): void => \{[\s\S]*?\} as any\);\n  \};', handlers_code, content)

# 5. Connect buttons
content = content.replace('<TouchableOpacity style={styles.editProfileButton} onPress={handleUpdateProfile}>', '<TouchableOpacity style={styles.editProfileButton} onPress={handlePickPhoto}>')
content = content.replace('<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => router.push({ pathname: "/priest/ProfileSetup", params: { isEditing: true, jumpToStep: 1, section: \'personalDetails\' } } as any)}\n            >',
                          '<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => setIsPersonalModalVisible(true)}\n            >')
content = content.replace('<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => router.push({ pathname: "/priest/ProfileSetup", params: { isEditing: true, jumpToStep: 4, section: \'temples\' } } as any)}\n            >',
                          '<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => setIsTempleModalVisible(true)}\n            >')
content = content.replace('<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => router.push({ pathname: "/ProfileSetup", params: { isEditing: true, jumpToStep: 1, section: \'contactInfo\' } } as any)}\n            >',
                          '<TouchableOpacity\n              style={styles.editButton}\n              onPress={() => setIsPersonalModalVisible(true)}\n            >')


# 6. Add modals at the bottom
modals_code = """
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
  },
});
"""

content = content.replace('    </View>\n  );\n};\n\nconst styles = StyleSheet.create({', modals_code + '\nconst styles = StyleSheet.create({')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("File successfully patched.")
