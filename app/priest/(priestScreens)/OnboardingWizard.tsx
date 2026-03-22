import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import * as SecureStore from 'expo-secure-store';
import { RootState, AppDispatch } from "../../../redux/store";
import { setStep, updateFormData, loadDraft, resetOnboarding } from "../../../redux/slices/onboardingSlice";
import { register, setProfileCompleted } from "../../../redux/slices/authSlice";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// --- Sub-components (Steps) ---

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  );
};

const Step1BasicInfo = () => {
  const { formData } = useSelector((state: RootState) => state.onboarding);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepLabel}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(v) => dispatch(updateFormData({ name: v }))}
        placeholder="Acharaya Name"
      />
      
      <Text style={styles.stepLabel}>WhatsApp Number</Text>
      <TextInput
        style={styles.input}
        value={formData.whatsappNumber}
        onChangeText={(v) => dispatch(updateFormData({ whatsappNumber: v }))}
        placeholder="+91 "
        keyboardType="phone-pad"
      />

      <Text style={styles.stepLabel}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        value={formData.experienceYears}
        onChangeText={(v) => dispatch(updateFormData({ experienceYears: v }))}
        placeholder="e.g. 10"
        keyboardType="numeric"
      />

      <Text style={styles.stepLabel}>Short Bio</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={formData.bio}
        onChangeText={(v) => dispatch(updateFormData({ bio: v }))}
        placeholder="Tell devotees about your lineage and expertise..."
        multiline
      />
    </View>
  );
};

const Step2RegionTradition = () => {
    const { formData } = useSelector((state: RootState) => state.onboarding);
    const dispatch = useDispatch<AppDispatch>();
  
    const traditions = ["Smarta", "Vaishnava", "Shaiva", "Madhva", "Other"];
  
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Region & Tradition</Text>
        
        <Text style={styles.stepLabel}>Operating City</Text>
        <TextInput
          style={styles.input}
          value={formData.operatingCity}
          onChangeText={(v) => dispatch(updateFormData({ operatingCity: v }))}
          placeholder="e.g. Bangalore"
        />
  
        <Text style={styles.stepLabel}>Sampradaya / Tradition</Text>
        <View style={styles.traditionGrid}>
          {traditions.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tag, formData.sampradaya === t && styles.activeTag]}
              onPress={() => dispatch(updateFormData({ sampradaya: t }))}
            >
              <Text style={[styles.tagText, formData.sampradaya === t && styles.activeTagText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
};

const Step3RitualsSelection = () => {
    const { formData } = useSelector((state: RootState) => state.onboarding);
    const dispatch = useDispatch<AppDispatch>();
    const [ceremonies, setCeremonies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                // Fetch master ceremonies
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ceremonies`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.ceremonies || data.data || []);
                setCeremonies(list);
            } catch (e) {
                console.error("Failed to fetch ceremonies", e);
                setCeremonies([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleCeremony = (id: string) => {
        const current = formData.selectedCeremonies || [];
        const next = current.includes(id) ? current.filter((c: string) => c !== id) : [...current, id];
        dispatch(updateFormData({ selectedCeremonies: next }));
    };

    if (loading) return <ActivityIndicator size="large" color={APP_COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Rituals & Services</Text>
            <Text style={styles.subtitle}>Select the ceremonies you are qualified to perform.</Text>
            {ceremonies.map((c) => (
                <TouchableOpacity
                    key={c._id}
                    style={[styles.ceremonyItem, formData.selectedCeremonies.includes(c._id) && styles.activeCeremony]}
                    onPress={() => toggleCeremony(c._id)}
                >
                    <Ionicons 
                        name={formData.selectedCeremonies.includes(c._id) ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={formData.selectedCeremonies.includes(c._id) ? APP_COLORS.primary : APP_COLORS.gray} 
                    />
                    <Text style={styles.ceremonyName}>{c.name}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const Step4DocumentUpload = () => {
    const { formData } = useSelector((state: RootState) => state.onboarding);
    const dispatch = useDispatch<AppDispatch>();

    const pickImage = async (field: 'profilePhoto') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            dispatch(updateFormData({ [field]: result.assets[0].uri }));
        }
    };

    const pickDoc = async (field: 'aadhaarCard' | 'certificate') => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
        });
        if (!result.canceled) {
            dispatch(updateFormData({ [field]: result.assets[0].uri }));
        }
    };

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Verification Documents</Text>
            
            <Text style={styles.stepLabel}>Profile Photo (Required)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('profilePhoto')}>
                {formData.profilePhoto ? (
                    <Image source={{ uri: formData.profilePhoto }} style={styles.previewImage} />
                ) : (
                    <Ionicons name="camera-outline" size={32} color={APP_COLORS.gray} />
                )}
            </TouchableOpacity>

            <Text style={styles.stepLabel}>Aadhaar Card / ID (Required PDF)</Text>
            <TouchableOpacity style={styles.docBox} onPress={() => pickDoc('aadhaarCard')}>
                <Ionicons name="document-text-outline" size={24} color={formData.aadhaarCard ? APP_COLORS.success : APP_COLORS.gray} />
                <Text style={styles.docText}>{formData.aadhaarCard ? "File Selected" : "Select PDF"}</Text>
            </TouchableOpacity>

            <Text style={styles.stepLabel}>Qualification Certificate (Optional)</Text>
            <TouchableOpacity style={styles.docBox} onPress={() => pickDoc('certificate')}>
                <Ionicons name="ribbon-outline" size={24} color={formData.certificate ? APP_COLORS.success : APP_COLORS.gray} />
                <Text style={styles.docText}>{formData.certificate ? "File Selected" : "Select PDF"}</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- Master Component ---

export default function OnboardingWizard() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { currentStep, formData } = useSelector((state: RootState) => state.onboarding);
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const draft = await SecureStore.getItemAsync('priest_onboarding_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        // If Redux already has fresh credentials from signup.tsx, prioritize them over the draft
        if (parsedDraft.formData) {
            parsedDraft.formData.name = formData.name || parsedDraft.formData.name;
            parsedDraft.formData.email = formData.email || parsedDraft.formData.email;
            parsedDraft.formData.password = formData.password || parsedDraft.formData.password;
            parsedDraft.formData.whatsappNumber = formData.whatsappNumber || parsedDraft.formData.whatsappNumber;
            if (formData.languages && formData.languages.length > 0) {
                parsedDraft.formData.languages = formData.languages;
            }
        }
        dispatch(loadDraft(parsedDraft));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSteps = 4;

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      dispatch(setStep(currentStep + 1));
    } else {
        // Final Submit
        handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.profilePhoto || !formData.aadhaarCard) {
        Alert.alert("Required", "Please upload your profile photo and Aadhaar card.");
        return;
    }

    setIsSubmitting(true);
    try {
        // 1. Register User Object First (If not already logged in)
        if (!userInfo) {
            await dispatch(register({
                name: formData.name,
                email: formData.email || '',
                password: formData.password || '',
                phone: formData.whatsappNumber,
                userType: 'priest',
                languagesSpoken: formData.languages,
            })).unwrap();
        }

        // 2. Upload Profile Picture
        if (formData.profilePhoto) {
            await priestService.uploadDocument(
                { uri: formData.profilePhoto, name: 'profile.jpg', type: 'image/jpeg' },
                'profile_picture'
            );
        }

        // 3. Upload Aadhaar Card
        if (formData.aadhaarCard) {
            await priestService.uploadDocument(
                { uri: formData.aadhaarCard, name: 'aadhaar.pdf', type: 'application/pdf' },
                'government_id'
            );
        }

        // 4. Upload Optional Certificate
        if (formData.certificate) {
            await priestService.uploadDocument(
                { uri: formData.certificate, name: 'certificate.pdf', type: 'application/pdf' },
                'religious_certificate'
            );
        }
        
        // 5. Update Profile with Services & Location
        await priestService.updateProfile({
            experience: parseInt(formData.experienceYears) || 0,
            description: formData.bio,
            sampradaya: formData.sampradaya,
            // Add other fields as needed
        });

        // 6. Submit for Verification
        await priestService.submitVerification({
            experience: formData.experienceYears,
            description: formData.bio,
            sampradaya: formData.sampradaya,
            services: formData.selectedCeremonies.map((id: string) => ({ ceremonyId: id, price: 1000, durationMinutes: 60 })),
            languagesSpoken: formData.languages
        });

        // 7. Store update & Cleanup
        dispatch(setProfileCompleted(true));
        dispatch(resetOnboarding());
        
        Alert.alert("Success!", "Your profile has been submitted for review. You will be notified once approved.", [
            { text: "OK", onPress: () => router.replace("/priest/HomeTab") }
        ]);

    } catch (e: any) {
        if (typeof e === 'string' && e.toLowerCase().includes("user already exists")) {
            Alert.alert(
                "Account Exists",
                "It looks like you've already registered an account with this email/phone. Please login instead to complete your onboarding.",
                [
                    { text: "Go to Login", onPress: () => router.replace("/(auth)/login" as any) },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            Alert.alert("Error", e || "An unexpected error occurred.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Priest Onboarding</Text>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentStep === 0 && <Step1BasicInfo />}
        {currentStep === 1 && <Step2RegionTradition />}
        {currentStep === 2 && <Step3RitualsSelection />}
        {currentStep === 3 && <Step4DocumentUpload />}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.backBtn, currentStep === 0 && { opacity: 0 }]} 
          onPress={() => dispatch(setStep(currentStep - 1))}
          disabled={currentStep === 0}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={isSubmitting}>
          {isSubmitting ? (
              <ActivityIndicator color="white" />
          ) : (
              <Text style={styles.nextBtnText}>{currentStep === totalSteps - 1 ? "Submit Application" : "Continue"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  header: { padding: 20, backgroundColor: APP_COLORS.white, borderBottomWidth: 1, borderBottomColor: APP_COLORS.lightGray },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: APP_COLORS.black, marginBottom: 15 },
  progressContainer: { height: 6, backgroundColor: APP_COLORS.lightGray, borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: APP_COLORS.primary },
  
  scrollContent: { padding: 20 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 22, fontWeight: "bold", color: APP_COLORS.black, marginBottom: 8 },
  subtitle: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: APP_COLORS.gray, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  
  traditionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: APP_COLORS.lightGray },
  activeTag: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  tagText: { color: APP_COLORS.black },
  activeTagText: { color: APP_COLORS.white, fontWeight: "bold" },
  
  ceremonyItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 16, 
    backgroundColor: APP_COLORS.white, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray
  },
  activeCeremony: { borderColor: APP_COLORS.primary, backgroundColor: APP_COLORS.primary + "05" },
  ceremonyName: { marginLeft: 12, fontSize: 16, color: APP_COLORS.black },
  
  uploadBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: APP_COLORS.lightGray, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  previewImage: { width: "100%", height: "100%" },
  docBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 16, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: APP_COLORS.gray, 
    borderRadius: 12, 
    gap: 12 
  },
  docText: { color: APP_COLORS.black, fontWeight: "600" },

  footer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 20, 
    backgroundColor: APP_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  backBtnText: { color: APP_COLORS.gray, fontSize: 16, fontWeight: "600" },
  nextBtn: { backgroundColor: APP_COLORS.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  nextBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: "bold" },
});
