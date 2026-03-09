import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

const PujaRequestDetails = () => {
    const params = useLocalSearchParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!params.bookingId) {
            setError("No booking ID provided");
            setLoading(false);
            return;
        }

        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await priestService.getBookingDetails(params.bookingId!);
                if (mounted) setBooking(data);
            } catch (err: any) {
                if (mounted)
                    setError(err?.message || "Failed to load booking details");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [params.bookingId]);

    const openMaps = () => {
        if (!booking?.location) return;
        const query = booking.location.coordinates
            ? `${booking.location.coordinates[1]},${booking.location.coordinates[0]}`
            : booking.location.address;
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
        });
        if (url) Linking.openURL(url);
    };

    const handleDecision = (action: "accept" | "reject") => {
        const isAccept = action === "accept";
        Alert.alert(
            isAccept ? "Accept Request" : "Reject Request",
            isAccept
                ? `Accept this ${booking?.ceremonyType || "puja"} request?`
                : `Reject this ${booking?.ceremonyType || "puja"} request? The devotee will be notified.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: isAccept ? "Accept" : "Reject",
                    style: isAccept ? "default" : "destructive",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            const status = isAccept ? "confirmed" : "cancelled";
                            const notes = isAccept ? undefined : "Priest declined the request";
                            await priestService.updateBookingStatus(
                                booking._id,
                                status,
                                notes
                            );
                            Alert.alert(
                                "Success",
                                isAccept
                                    ? "Booking accepted! The devotee has been notified."
                                    : "Booking rejected. The devotee has been notified.",
                                [{ text: "OK", onPress: () => router.back() }]
                            );
                        } catch (err: any) {
                            Alert.alert(
                                "Error",
                                err?.message || "Failed to update booking"
                            );
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleStatusUpdate = (newStatus: "completed" | "cancelled") => {
        const label = newStatus === "completed" ? "Mark as Completed" : "Cancel Booking";
        Alert.alert(
            "Update Status",
            `Are you sure you want to ${newStatus === "completed" ? "mark this booking as completed" : "cancel this booking"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    style: newStatus === "cancelled" ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            await priestService.updateBookingStatus(booking._id, newStatus);
                            Alert.alert(
                                "Success",
                                newStatus === "completed"
                                    ? "Booking marked as completed!"
                                    : "Booking has been cancelled.",
                                [{ text: "OK", onPress: () => router.back() }]
                            );
                        } catch (err: any) {
                            Alert.alert("Error", err?.message || "Failed to update status");
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={APP_COLORS.primary} />
                    <Text style={styles.loadingText}>Loading request details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !booking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
                <View style={styles.centerContent}>
                    <Ionicons name="alert-circle-outline" size={48} color={APP_COLORS.error} />
                    <Text style={styles.errorText}>{error || "Booking not found"}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const devotee = booking.devoteeId;
    const isPending = booking.status === "pending";
    const isConfirmed = booking.status === "confirmed";
    const showBottomBar = isPending || isConfirmed;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={{ paddingBottom: showBottomBar ? 100 : 24 }}
            >
                {/* Status Badge */}
                <View style={styles.statusRow}>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    booking.status === "pending"
                                        ? APP_COLORS.warning + "20"
                                        : booking.status === "confirmed"
                                            ? APP_COLORS.success + "20"
                                            : APP_COLORS.error + "20",
                                borderColor:
                                    booking.status === "pending"
                                        ? APP_COLORS.warning
                                        : booking.status === "confirmed"
                                            ? APP_COLORS.success
                                            : APP_COLORS.error,
                            },
                        ]}
                    >
                        <Ionicons
                            name={
                                booking.status === "pending"
                                    ? "hourglass-outline"
                                    : booking.status === "confirmed"
                                        ? "checkmark-circle-outline"
                                        : "close-circle-outline"
                            }
                            size={16}
                            color={
                                booking.status === "pending"
                                    ? APP_COLORS.warning
                                    : booking.status === "confirmed"
                                        ? APP_COLORS.success
                                        : APP_COLORS.error
                            }
                        />
                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color:
                                        booking.status === "pending"
                                            ? APP_COLORS.warning
                                            : booking.status === "confirmed"
                                                ? APP_COLORS.success
                                                : APP_COLORS.error,
                                },
                            ]}
                        >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                    </View>
                    <Text style={styles.requestedOn}>
                        Requested {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                </View>

                {/* Ceremony Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flame-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Ceremony Details</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ceremony Type</Text>
                        <Text style={styles.detailValue}>{booking.ceremonyType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Time</Text>
                        <Text style={styles.detailValue}>
                            {booking.startTime} — {booking.endTime}
                        </Text>
                    </View>
                </View>

                {/* Devotee Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Devotee Information</Text>
                    </View>
                    <View style={styles.devoteeRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {devotee?.name?.charAt(0) || "D"}
                            </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.devoteeName}>{devotee?.name || "Devotee"}</Text>
                            {devotee?.phone && (
                                <TouchableOpacity
                                    style={styles.contactRow}
                                    onPress={() => Linking.openURL(`tel:${devotee.phone}`)}
                                >
                                    <Ionicons name="call-outline" size={14} color={APP_COLORS.info} />
                                    <Text style={styles.contactText}>{devotee.phone}</Text>
                                </TouchableOpacity>
                            )}
                            {devotee?.email && (
                                <View style={styles.contactRow}>
                                    <Ionicons name="mail-outline" size={14} color={APP_COLORS.gray} />
                                    <Text style={styles.contactText}>{devotee.email}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Location</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={[styles.detailValue, { flex: 1, textAlign: "right" }]}>
                            {booking.location?.address || "—"}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>City</Text>
                        <Text style={styles.detailValue}>
                            {booking.location?.city || "—"}
                        </Text>
                    </View>
                    {booking.location?.address && (
                        <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
                            <Ionicons name="navigate-outline" size={16} color={APP_COLORS.primary} />
                            <Text style={styles.mapBtnText}>Open in Maps</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Payment Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cash-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Payment Details</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Base Price</Text>
                        <Text style={styles.detailValue}>₹{booking.basePrice}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Platform Fee</Text>
                        <Text style={styles.detailValue}>₹{booking.platformFee || 0}</Text>
                    </View>
                    <View style={[styles.detailRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{booking.totalAmount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Status</Text>
                        <Text
                            style={[
                                styles.detailValue,
                                {
                                    color:
                                        booking.paymentStatus === "completed"
                                            ? APP_COLORS.success
                                            : APP_COLORS.warning,
                                    fontWeight: "bold",
                                },
                            ]}
                        >
                            {booking.paymentStatus === "completed" ? "Paid" : "Pending"}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {booking.notes && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Special Notes</Text>
                        </View>
                        <Text style={styles.notesText}>{booking.notes}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            {isPending && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.decisionBtn, styles.rejectBtn]}
                        onPress={() => handleDecision("reject")}
                        disabled={submitting}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={APP_COLORS.error} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.decisionBtn, styles.acceptBtn]}
                        onPress={() => handleDecision("accept")}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={APP_COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color={APP_COLORS.white} />
                                <Text style={styles.acceptBtnText}>Accept</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
            {isConfirmed && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.decisionBtn, styles.rejectBtn]}
                        onPress={() => handleStatusUpdate("cancelled")}
                        disabled={submitting}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={APP_COLORS.error} />
                        <Text style={styles.rejectBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.decisionBtn, styles.completeBtn]}
                        onPress={() => handleStatusUpdate("completed")}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={APP_COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-done-outline" size={20} color={APP_COLORS.white} />
                                <Text style={styles.acceptBtnText}>Mark Complete</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: APP_COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
        elevation: 2,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: APP_COLORS.black,
    },
    headerPlaceholder: { width: 40 },
    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        color: APP_COLORS.gray,
        fontSize: 14,
    },
    errorText: {
        marginTop: 12,
        color: APP_COLORS.error,
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: APP_COLORS.primary,
    },
    retryText: {
        color: APP_COLORS.white,
        fontWeight: "bold",
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    statusText: {
        fontWeight: "bold",
        fontSize: 13,
    },
    requestedOn: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: APP_COLORS.black,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: APP_COLORS.gray,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "500",
        color: APP_COLORS.black,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
        paddingTop: 10,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: "bold",
        color: APP_COLORS.black,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: APP_COLORS.primary,
    },
    devoteeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: APP_COLORS.primary + "20",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: APP_COLORS.primary,
    },
    devoteeName: {
        fontSize: 16,
        fontWeight: "bold",
        color: APP_COLORS.black,
        marginBottom: 4,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },
    contactText: {
        fontSize: 13,
        color: APP_COLORS.gray,
    },
    mapBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 6,
    },
    mapBtnText: {
        color: APP_COLORS.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    notesText: {
        fontSize: 14,
        color: APP_COLORS.bodyText,
        lineHeight: 22,
        fontStyle: "italic",
    },
    // Sticky bottom bar
    bottomBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: APP_COLORS.white,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
        gap: 12,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    decisionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    rejectBtn: {
        backgroundColor: APP_COLORS.white,
        borderWidth: 2,
        borderColor: APP_COLORS.error,
    },
    acceptBtn: {
        backgroundColor: APP_COLORS.success,
    },
    completeBtn: {
        backgroundColor: APP_COLORS.info || '#2196F3',
    },
    rejectBtnText: {
        color: APP_COLORS.error,
        fontWeight: "bold",
        fontSize: 16,
    },
    acceptBtnText: {
        color: APP_COLORS.white,
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default PujaRequestDetails;
