import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

type VerificationState = "loading" | "not_submitted" | "pending" | "verified" | "rejected";

export default function VerificationStatus() {
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<VerificationState>("loading");
    const [docStatuses, setDocStatuses] = useState<{ type: string; status: string; fileName: string }[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await priestService.getProfile();
                const profile = res.profile || res;
                const isVerified = profile?.isVerified;
                const docs = profile?.verificationDocuments || [];

                setDocStatuses(docs.map((d: any) => ({
                    type: d.type,
                    status: d.status,
                    fileName: d.fileName || d.type,
                })));

                if (isVerified) {
                    setState("verified");
                } else if (docs.length === 0) {
                    setState("not_submitted");
                } else if (docs.some((d: any) => d.status === "rejected")) {
                    setState("rejected");
                } else {
                    setState("pending");
                }
            } catch {
                setState("not_submitted");
            }
        })();
    }, []);

    const iconMap: Record<VerificationState, { name: string; color: string }> = {
        loading: { name: "hourglass-outline", color: APP_COLORS.gray },
        not_submitted: { name: "alert-circle-outline", color: APP_COLORS.warning },
        pending: { name: "time-outline", color: APP_COLORS.warning },
        verified: { name: "checkmark-circle", color: APP_COLORS.success },
        rejected: { name: "close-circle", color: APP_COLORS.error },
    };

    const titleMap: Record<VerificationState, string> = {
        loading: "Checking...",
        not_submitted: "Documents Not Submitted",
        pending: "Profile Under Review",
        verified: "Profile Verified!",
        rejected: "Verification Rejected",
    };

    const descMap: Record<VerificationState, string> = {
        loading: "",
        not_submitted: "You haven't submitted your verification documents yet. Please upload your Aadhaar and any certificates to get verified.",
        pending: "Your documents are being reviewed by our team. This usually takes 1-2 business days. You'll be notified once the review is complete.",
        verified: "Your profile has been verified. You can now accept bookings from devotees.",
        rejected: "One or more of your documents were rejected. Please re-upload valid documents.",
    };

    const icon = iconMap[state];

    if (state === "loading") {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification Status</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 24, alignItems: "center" }}>
                {/* Big Icon */}
                <View style={[styles.iconCircle, { borderColor: icon.color }]}>
                    <Ionicons name={icon.name as any} size={64} color={icon.color} />
                </View>

                <Text style={styles.title}>{titleMap[state]}</Text>
                <Text style={styles.desc}>{descMap[state]}</Text>

                {/* Document Statuses */}
                {docStatuses.length > 0 && (
                    <View style={styles.docsCard}>
                        <Text style={styles.docsCardTitle}>Submitted Documents</Text>
                        {docStatuses.map((doc, idx) => (
                            <View key={idx} style={styles.docRow}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={18}
                                    color={APP_COLORS.primary}
                                />
                                <Text style={styles.docName}>
                                    {doc.type === "government_id" ? "Aadhaar / Govt ID" : "Religious Certificate"}
                                </Text>
                                <View style={[
                                    styles.docBadge,
                                    {
                                        backgroundColor: doc.status === "verified"
                                            ? APP_COLORS.success
                                            : doc.status === "rejected"
                                                ? APP_COLORS.error
                                                : APP_COLORS.warning,
                                    },
                                ]}>
                                    <Text style={styles.docBadgeText}>
                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Booking blocked banner */}
                {state !== "verified" && (
                    <View style={styles.blockedBanner}>
                        <Ionicons name="lock-closed" size={20} color={APP_COLORS.error} />
                        <Text style={styles.blockedText}>
                            Bookings are disabled until your profile is verified.
                        </Text>
                    </View>
                )}

                {/* Actions */}
                {(state === "not_submitted" || state === "rejected") && (
                    <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={() => router.push("/priest/DocumentUpload" as any)}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color={APP_COLORS.white} />
                        <Text style={styles.uploadBtnText}>
                            {state === "rejected" ? "Re-upload Documents" : "Upload Documents"}
                        </Text>
                    </TouchableOpacity>
                )}

                {(state === "verified" || state === "pending") && (
                    <TouchableOpacity
                        style={[styles.uploadBtn, state === "verified" && { backgroundColor: APP_COLORS.success }]}
                        onPress={() => router.push("/priest/HomeTab" as any)}
                    >
                        <Text style={styles.uploadBtnText}>Go to Dashboard</Text>
                        <Ionicons name="arrow-forward" size={20} color={APP_COLORS.white} />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLORS.background },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: APP_COLORS.background },
    header: {
        backgroundColor: APP_COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50,
    },
    backBtn: { padding: 5 },
    headerTitle: { color: APP_COLORS.white, fontSize: 20, fontWeight: "bold" },
    content: { flex: 1, padding: 20 },

    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
        marginBottom: 24,
        backgroundColor: APP_COLORS.white,
    },
    title: { fontSize: 22, fontWeight: "bold", color: APP_COLORS.black, marginBottom: 12, textAlign: "center" },
    desc: { fontSize: 14, color: APP_COLORS.gray, textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },

    docsCard: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 14,
        padding: 16,
        width: "100%",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    docsCardTitle: { fontSize: 15, fontWeight: "bold", color: APP_COLORS.black, marginBottom: 12 },
    docRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: APP_COLORS.lightGray },
    docName: { flex: 1, fontSize: 14, color: APP_COLORS.black },
    docBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    docBadgeText: { color: APP_COLORS.white, fontSize: 11, fontWeight: "bold" },

    blockedBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: APP_COLORS.error + "12",
        borderLeftWidth: 3,
        borderLeftColor: APP_COLORS.error,
        borderRadius: 10,
        padding: 14,
        width: "100%",
        marginBottom: 20,
    },
    blockedText: { flex: 1, fontSize: 13, color: APP_COLORS.error, fontWeight: "600" },

    uploadBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: APP_COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: "100%",
    },
    uploadBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: "bold" },
});
