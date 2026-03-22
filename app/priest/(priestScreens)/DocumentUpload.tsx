import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

interface DocState {
    uri: string;
    name: string;
    type: string;
    uploaded: boolean;
    uploading: boolean;
    serverStatus?: "pending" | "verified" | "rejected";
}

const EMPTY: DocState = { uri: "", name: "", type: "", uploaded: false, uploading: false };

export default function DocumentUpload() {
    const insets = useSafeAreaInsets();
    const [aadhaar, setAadhaar] = useState<DocState>({ ...EMPTY });
    const [certificate, setCertificate] = useState<DocState>({ ...EMPTY });
    const [loading, setLoading] = useState(true);

    // Fetch existing docs on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await priestService.getProfile();
                const profile = res.profile || res;
                const docs = profile?.verificationDocuments || [];
                for (const doc of docs) {
                    const state: DocState = {
                        uri: "",
                        name: doc.fileName || `${doc.type}.pdf`,
                        type: doc.contentType || "application/pdf",
                        uploaded: true,
                        uploading: false,
                        serverStatus: doc.status,
                    };
                    if (doc.type === "government_id") setAadhaar(state);
                    if (doc.type === "religious_certificate") setCertificate(state);
                }
            } catch {
                // Profile not found is OK for new priests
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const pickDocument = useCallback(async (docType: "government_id" | "religious_certificate") => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const file = result.assets[0];
            const state: DocState = {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || "application/pdf",
                uploaded: false,
                uploading: false,
            };

            if (docType === "government_id") setAadhaar(state);
            else setCertificate(state);
        } catch (err) {
            Alert.alert("Error", "Failed to pick document. Please try again.");
        }
    }, []);

    const uploadDoc = useCallback(async (docType: "government_id" | "religious_certificate") => {
        const doc = docType === "government_id" ? aadhaar : certificate;
        const setDoc = docType === "government_id" ? setAadhaar : setCertificate;

        if (!doc.uri) {
            Alert.alert("Select a file first");
            return;
        }

        setDoc((prev) => ({ ...prev, uploading: true }));

        try {
            await priestService.uploadDocument(
                { uri: doc.uri, name: doc.name, type: doc.type },
                docType
            );
            setDoc((prev) => ({ ...prev, uploaded: true, uploading: false, serverStatus: "pending" }));
            Alert.alert("Success", "Document uploaded for review!");
        } catch (err: any) {
            setDoc((prev) => ({ ...prev, uploading: false }));
            Alert.alert("Upload Failed", typeof err === "string" ? err : "Please try again.");
        }
    }, [aadhaar, certificate]);

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const colors: Record<string, string> = {
            pending: APP_COLORS.warning,
            verified: APP_COLORS.success,
            rejected: APP_COLORS.error,
        };
        return (
            <View style={[styles.statusPill, { backgroundColor: colors[status] || APP_COLORS.gray }]}>
                <Text style={styles.statusPillText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </View>
        );
    };

    const allUploaded = aadhaar.uploaded; // Aadhaar is required, certificate is optional

    if (loading) {
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
                <Text style={styles.headerTitle}>Upload Documents</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
                <Text style={styles.subtitle}>
                    Upload your identity documents for verification. Your profile will be reviewed before you can accept bookings.
                </Text>

                {/* Aadhaar / Government ID */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <Ionicons name="id-card-outline" size={22} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Aadhaar / Government ID</Text>
                            <Text style={styles.requiredTag}>Required</Text>
                        </View>
                        {getStatusBadge(aadhaar.serverStatus)}
                    </View>
                    <Text style={styles.cardDesc}>Upload a PDF of your Aadhaar card or Government-issued ID.</Text>

                    {aadhaar.name ? (
                        <View style={styles.fileRow}>
                            <Ionicons name="document-text" size={18} color={APP_COLORS.primary} />
                            <Text style={styles.fileName} numberOfLines={1}>{aadhaar.name}</Text>
                            {!aadhaar.uploaded && (
                                <TouchableOpacity onPress={() => setAadhaar({ ...EMPTY })}>
                                    <Ionicons name="close-circle" size={20} color={APP_COLORS.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null}

                    <View style={styles.cardActions}>
                        {!aadhaar.uploaded && (
                            <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument("government_id")}>
                                <Ionicons name="folder-open-outline" size={18} color={APP_COLORS.primary} />
                                <Text style={styles.pickBtnText}>{aadhaar.name ? "Change File" : "Select File"}</Text>
                            </TouchableOpacity>
                        )}
                        {aadhaar.uri && !aadhaar.uploaded && (
                            <TouchableOpacity
                                style={[styles.uploadBtn, aadhaar.uploading && { opacity: 0.6 }]}
                                onPress={() => uploadDoc("government_id")}
                                disabled={aadhaar.uploading}
                            >
                                {aadhaar.uploading ? (
                                    <ActivityIndicator size="small" color={APP_COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={18} color={APP_COLORS.white} />
                                        <Text style={styles.uploadBtnText}>Upload</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Religious Certificate (Optional) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <Ionicons name="ribbon-outline" size={22} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Vedapatashala Certificate</Text>
                            <Text style={styles.optionalTag}>Optional</Text>
                        </View>
                        {getStatusBadge(certificate.serverStatus)}
                    </View>
                    <Text style={styles.cardDesc}>Upload your Vedapatashala or other religious training certificate (PDF).</Text>

                    {certificate.name ? (
                        <View style={styles.fileRow}>
                            <Ionicons name="document-text" size={18} color={APP_COLORS.primary} />
                            <Text style={styles.fileName} numberOfLines={1}>{certificate.name}</Text>
                            {!certificate.uploaded && (
                                <TouchableOpacity onPress={() => setCertificate({ ...EMPTY })}>
                                    <Ionicons name="close-circle" size={20} color={APP_COLORS.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null}

                    <View style={styles.cardActions}>
                        {!certificate.uploaded && (
                            <TouchableOpacity style={styles.pickBtn} onPress={() => pickDocument("religious_certificate")}>
                                <Ionicons name="folder-open-outline" size={18} color={APP_COLORS.primary} />
                                <Text style={styles.pickBtnText}>{certificate.name ? "Change File" : "Select File"}</Text>
                            </TouchableOpacity>
                        )}
                        {certificate.uri && !certificate.uploaded && (
                            <TouchableOpacity
                                style={[styles.uploadBtn, certificate.uploading && { opacity: 0.6 }]}
                                onPress={() => uploadDoc("religious_certificate")}
                                disabled={certificate.uploading}
                            >
                                {certificate.uploading ? (
                                    <ActivityIndicator size="small" color={APP_COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={18} color={APP_COLORS.white} />
                                        <Text style={styles.uploadBtnText}>Upload</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Submit / Continue */}
                <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => {
                        router.push("/priest/VerificationStatus" as any);
                    }}
                >
                    <Text style={styles.continueBtnText}>{allUploaded ? "Save & View Status" : "Save & Continue"}</Text>
                    <Ionicons name="arrow-forward" size={20} color={APP_COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.skipBtn} 
                    onPress={() => router.push("/priest/HomeTab" as any)}
                >
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
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
    subtitle: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 20, lineHeight: 20 },

    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: APP_COLORS.black },
    cardDesc: { fontSize: 13, color: APP_COLORS.gray, marginBottom: 12 },
    requiredTag: {
        fontSize: 10,
        fontWeight: "bold",
        color: APP_COLORS.error,
        backgroundColor: APP_COLORS.error + "15",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    optionalTag: {
        fontSize: 10,
        fontWeight: "bold",
        color: APP_COLORS.info,
        backgroundColor: APP_COLORS.info + "15",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },

    fileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: APP_COLORS.primary + "10",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    fileName: { flex: 1, fontSize: 13, color: APP_COLORS.black },

    cardActions: { flexDirection: "row", gap: 10 },
    pickBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: APP_COLORS.primary,
    },
    pickBtnText: { color: APP_COLORS.primary, fontWeight: "600", fontSize: 14 },
    uploadBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: APP_COLORS.primary,
    },
    uploadBtnText: { color: APP_COLORS.white, fontWeight: "600", fontSize: 14 },

    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPillText: { color: APP_COLORS.white, fontSize: 11, fontWeight: "bold" },

    continueBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: APP_COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    continueBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: "bold" },
    skipBtn: {
        alignItems: "center",
        padding: 16,
    },
    skipBtnText: { color: APP_COLORS.gray, fontSize: 14 },
});
