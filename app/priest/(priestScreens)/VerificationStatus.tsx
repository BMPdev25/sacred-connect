import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
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
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <LinearGradient
                colors={['#FFFFFF', '#FDFBF7']}
                style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.tertiary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verification</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.content} 
                contentContainerStyle={{ paddingBottom: insets.bottom + 24, alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                {/* Big Icon */}
                <View style={[styles.iconCircle, { borderColor: icon.color + '20', backgroundColor: icon.color + '08' }]}>
                    <Ionicons name={icon.name as any} size={80} color={icon.color} />
                </View>

                <Text style={styles.title}>{titleMap[state]}</Text>
                <Text style={styles.desc}>{descMap[state]}</Text>

                {/* Document Statuses */}
                {docStatuses.length > 0 && (
                    <View style={styles.docsCard}>
                        <Text style={styles.docsCardTitle}>Submitted Documents</Text>
                        {docStatuses.map((doc, idx) => (
                            <View key={idx} style={[styles.docRow, idx === docStatuses.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.docIconContainer}>
                                    <Ionicons
                                        name="document-text-outline"
                                        size={20}
                                        color={APP_COLORS.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docName}>
                                        {doc.type === "government_id" ? "Aadhaar / Govt ID" : "Religious Certificate"}
                                    </Text>
                                    <Text style={styles.docSubtitle}>{doc.fileName}</Text>
                                </View>
                                <View style={[
                                    styles.docBadge,
                                    {
                                        backgroundColor: doc.status === "verified"
                                            ? APP_COLORS.success + '15'
                                            : doc.status === "rejected"
                                                ? APP_COLORS.error + '15'
                                                : APP_COLORS.warning + '15',
                                    },
                                ]}>
                                    <Text style={[
                                        styles.docBadgeText,
                                        {
                                            color: doc.status === "verified"
                                                ? APP_COLORS.success
                                                : doc.status === "rejected"
                                                    ? APP_COLORS.error
                                                    : APP_COLORS.warning,
                                        }
                                    ]}>
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
                        <View style={styles.lockIconContainer}>
                            <Ionicons name="lock-closed" size={20} color={APP_COLORS.error} />
                        </View>
                        <Text style={styles.blockedText}>
                            Bookings are disabled until your profile is verified.
                        </Text>
                    </View>
                )}

                {/* Actions */}
                {(state === "not_submitted" || state === "rejected") && (
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.push("/priest/DocumentUpload" as any)}
                    >
                        <Ionicons name="cloud-upload-outline" size={22} color={APP_COLORS.white} />
                        <Text style={styles.primaryBtnText}>
                            {state === "rejected" ? "Re-upload Documents" : "Upload Documents"}
                        </Text>
                    </TouchableOpacity>
                )}

                {(state === "verified" || state === "pending") && (
                    <TouchableOpacity
                        style={[styles.primaryBtn, state === "verified" && { backgroundColor: APP_COLORS.success }]}
                        onPress={() => router.replace("/priest/HomeTab" as any)}
                    >
                        <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
                        <Ionicons name="arrow-forward" size={22} color={APP_COLORS.white} />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLORS.neutral },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: APP_COLORS.neutral },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.divider,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backBtn: { 
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: APP_COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: { 
        color: APP_COLORS.tertiary, 
        fontSize: 22, 
        fontFamily: 'serif',
        fontWeight: "bold" 
    },
    content: { flex: 1 },

    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
        marginBottom: 24,
    },
    title: { 
        fontSize: 26, 
        fontFamily: 'serif',
        fontWeight: "bold", 
        color: APP_COLORS.tertiary, 
        marginBottom: 12, 
        textAlign: "center" 
    },
    desc: { 
        fontSize: 15, 
        color: APP_COLORS.secondary, 
        textAlign: "center", 
        lineHeight: 24, 
        marginBottom: 32, 
        paddingHorizontal: 30 
    },

    docsCard: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 20,
        padding: 20,
        width: "90%",
        marginBottom: 24,
        shadowColor: APP_COLORS.cardShadow,
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: APP_COLORS.divider,
    },
    docsCardTitle: { 
        fontSize: 16, 
        fontWeight: "bold", 
        fontFamily: 'serif',
        color: APP_COLORS.tertiary, 
        marginBottom: 16 
    },
    docRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 12, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: APP_COLORS.divider 
    },
    docIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: APP_COLORS.saffronLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docName: { fontSize: 15, fontWeight: '600', color: APP_COLORS.tertiary },
    docSubtitle: { fontSize: 12, color: APP_COLORS.gray, marginTop: 2 },
    docBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    docBadgeText: { fontSize: 12, fontWeight: "bold" },

    blockedBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: APP_COLORS.error + "08",
        borderRadius: 12,
        padding: 16,
        width: "90%",
        marginBottom: 32,
        borderWidth: 1,
        borderColor: APP_COLORS.error + "20",
    },
    lockIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: APP_COLORS.error + "15",
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockedText: { flex: 1, fontSize: 14, color: APP_COLORS.error, fontWeight: "600" },

    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: APP_COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 100,
        width: "90%",
        elevation: 4,
        shadowColor: APP_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryBtnText: { color: APP_COLORS.white, fontSize: 18, fontWeight: "bold" },
});
