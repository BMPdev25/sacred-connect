import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";
import { getImageUri } from "../../../utils/imageUtils";

const { width } = Dimensions.get('window');

const PujaRequestDetails = () => {
    const params = useLocalSearchParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
    const toastAnim = React.useRef(new Animated.Value(0)).current;
    const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, success: boolean) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, success });
        toastAnim.setValue(0);
        Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
        toastTimer.current = setTimeout(() => {
            Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
                setToast(null);
                if (success) router.back();
            });
        }, 2000);
    };

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

    // Countdown timer
    useEffect(() => {
        if (!booking?.date) return;
        const update = () => {
            const now = new Date().getTime();
            const target = new Date(booking.date).getTime();
            const diff = target - now;
            if (diff <= 0) { setCountdown(null); return; }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            let text = '';
            if (days > 0) text += `${days} day${days > 1 ? 's' : ''} `;
            if (hours > 0) text += `${hours} hr${hours > 1 ? 's' : ''} `;
            text += `${mins} min${mins > 1 ? 's' : ''}`;
            setCountdown(text.trim());
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [booking?.date]);

    const openMaps = () => {
        if (!booking?.location) return;

        const loc = booking.location;
        const lat = loc.coordinates?.[1];
        const lng = loc.coordinates?.[0];
        const hasCoords = typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0);

        // Build the best possible search query
        const query = hasCoords
            ? `${lat},${lng}`
            : [loc.address, loc.city, loc.state, loc.pincode]
                .filter(Boolean)
                .join(', ');

        if (!query) return;

        const encoded = encodeURIComponent(query);
        const url = Platform.select({
            ios: `maps:0,0?q=${encoded}`,
            android: `geo:0,0?q=${encoded}`,
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
                            showToast(
                                isAccept
                                    ? "✓ Booking accepted successfully"
                                    : "Booking rejected",
                                true
                            );
                        } catch (err: any) {
                            showToast(err?.message || "Failed to update booking", false);
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleStatusUpdate = (newStatus: "arrived" | "in_progress" | "completed" | "cancelled") => {
        let title = "";
        let message = "";
        let confirmText = "Confirm";

        switch (newStatus) {
            case "arrived":
                title = "I have Arrived";
                message = "Are you sure you want to mark yourself as arrived at the devotee's location?";
                break;
            case "in_progress":
                title = "Start Ritual";
                message = "Are you sure you want to mark the ritual as started?";
                break;
            case "completed":
                title = "Mark as Completed";
                message = "Are you sure you want to mark this booking as completed?";
                break;
            case "cancelled":
                title = "Cancel Booking";
                message = "You are about to cancel a confirmed booking. A penalty of ₹100 will be deducted from your wallet.";
                confirmText = "Yes, Cancel";
                break;
        }

        Alert.alert(
            title,
            message,
            [
                { text: "No", style: "cancel" },
                {
                    text: confirmText,
                    style: newStatus === "cancelled" ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            await priestService.updateBookingStatus(booking._id, newStatus);
                            Alert.alert(
                                "Success",
                                `Booking status updated to ${newStatus.replace("_", " ")}!`,
                                [{ text: "OK", onPress: () => {
                                    // Refresh or go back? Let's go back to be safe or refresh data
                                    if (newStatus === "completed" || newStatus === "cancelled") {
                                        router.back();
                                    } else {
                                        // Simple refresh logic - ideally we'd re-fetch
                                        setBooking({...booking, status: newStatus});
                                    }
                                }}]
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
                <LinearGradient colors={["#FFFFFF", APP_COLORS.neutral]} style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.tertiary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <View style={styles.headerPlaceholder} />
                </LinearGradient>
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
                <LinearGradient colors={["#FFFFFF", APP_COLORS.neutral]} style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLORS.tertiary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <View style={styles.headerPlaceholder} />
                </LinearGradient>
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

    const devotee = typeof booking.devoteeId === 'object' ? booking.devoteeId : null;
    const ceremonyName = booking.ceremonyDetails?.name || booking.ceremonyType || (typeof booking.ceremony === 'string' ? booking.ceremony : booking.ceremony?.name) || "Puja";
    const ceremonyImage = booking.ceremonyDetails?.image || booking.ceremony?.image || booking.ceremony?.images?.[0]?.url;

    const isPending = booking.status === "pending";
    const isConfirmed = booking.status === "confirmed";
    const isArrived = booking.status === "arrived";
    const isInProgress = booking.status === "in_progress";

    // Date check: Is today the day of the booking?
    const isToday = new Date().toISOString().split('T')[0] === new Date(booking.date).toISOString().split('T')[0];

    // Show bottom bar with buttons ONLY if it's today (for operational status) 
    // OR if it's pending (for accept/reject which can happen anytime)
    const showBottomBar = isPending || (isToday && (isConfirmed || isArrived || isInProgress));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={["#FFFFFF", APP_COLORS.neutral]} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.tertiary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerPlaceholder} />
            </LinearGradient>

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
                                    booking.status === "pending" || booking.status === "requested"
                                        ? APP_COLORS.warning + "15"
                                        : (booking.status === "confirmed" || booking.status === "arrived" || booking.status === "in_progress" || booking.status === "completed")
                                            ? APP_COLORS.success + "15"
                                            : APP_COLORS.error + "15",
                                borderColor:
                                    booking.status === "pending" || booking.status === "requested"
                                        ? APP_COLORS.warning + "40"
                                        : (booking.status === "confirmed" || booking.status === "arrived" || booking.status === "in_progress" || booking.status === "completed")
                                            ? APP_COLORS.success + "40"
                                            : APP_COLORS.error + "40",
                            },
                        ]}
                    >
                        <View style={[
                            styles.statusDot, 
                            { 
                                backgroundColor: 
                                    booking.status === "pending" || booking.status === "requested"
                                        ? APP_COLORS.warning
                                        : (booking.status === "confirmed" || booking.status === "arrived" || booking.status === "in_progress" || booking.status === "completed")
                                            ? APP_COLORS.success
                                            : APP_COLORS.error
                            }
                        ]} />
                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color:
                                        booking.status === "pending" || booking.status === "requested"
                                            ? APP_COLORS.warning
                                            : (booking.status === "confirmed" || booking.status === "arrived" || booking.status === "in_progress" || booking.status === "completed")
                                                ? APP_COLORS.success
                                                : APP_COLORS.error,
                                },
                            ]}
                        >
                            {booking.status === 'requested' ? 'Pending Acceptance' : booking.status.replace("_", " ").charAt(0).toUpperCase() + booking.status.replace("_", " ").slice(1)}
                        </Text>
                    </View>
                    <Text style={styles.requestedOn}>
                        ID: #{booking._id?.slice(-6).toUpperCase()}
                    </Text>
                </View>

                {/* Countdown Timer */}
                {countdown && (booking.status === "pending" || booking.status === "confirmed") && (
                    <View style={styles.countdownCard}>
                        <Ionicons name="timer-outline" size={20} color={APP_COLORS.primary} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.countdownLabel}>Starts in</Text>
                            <Text style={styles.countdownValue}>{countdown}</Text>
                        </View>
                    </View>
                )}

                {/* Ceremony Details */}
                <View style={styles.card}>
                    <View style={styles.ceremonyHeader}>
                        <Image 
                            source={{ uri: getImageUri(ceremonyImage) }} 
                            style={styles.ceremonyImg}
                        />
                        <View style={styles.ceremonyInfoMain}>
                            <Text style={styles.ceremonyNameTitle}>{ceremonyName}</Text>
                            <Text style={styles.ceremonySubText}>
                                {booking.ceremonyDetails?.category || "Traditional Ritual"}
                            </Text>
                            <View style={styles.durationBadge}>
                                <Ionicons name="time-outline" size={12} color={APP_COLORS.primary} />
                                <Text style={styles.durationText}>
                                    {booking.ceremonyDetails?.duration?.typical || 60} mins
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="calendar" size={16} color={APP_COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>Date</Text>
                                <Text style={styles.scheduleValue}>{formatDate(booking.date)}</Text>
                            </View>
                        </View>
                        <View style={styles.scheduleItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="time" size={16} color={APP_COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>Time</Text>
                                <Text style={styles.scheduleValue}>
                                    {booking.startTime} - {booking.endTime}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Devotee Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Devotee Details</Text>
                    </View>
                    <View style={styles.devoteeRow}>
                        {devotee?.profilePicture ? (
                            <Image 
                                source={{ uri: getImageUri(devotee.profilePicture) }} 
                                style={styles.avatarImg} 
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {devotee?.name?.charAt(0) || "D"}
                                </Text>
                            </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.devoteeName}>{devotee?.name || "Devotee"}</Text>
                            <Text style={styles.devoteeSubtitle}>Regular Practitioner</Text>
                        </View>
                        <View style={styles.actionIcons}>
                            <TouchableOpacity
                                style={[styles.actionIconBtn, { backgroundColor: APP_COLORS.success + '15' }]}
                                onPress={() => Linking.openURL(`tel:${devotee?.phone}`)}
                                disabled={!devotee?.phone}
                            >
                                <Ionicons name="call" size={20} color={APP_COLORS.success} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionIconBtn, { backgroundColor: APP_COLORS.info + '15' }]}
                                onPress={() => Linking.openURL(`sms:${devotee?.phone}`)}
                                disabled={!devotee?.phone}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color={APP_COLORS.info} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Location & Payment Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location-outline" size={20} color={APP_COLORS.primary} />
                        <Text style={styles.cardTitle}>Location & Price</Text>
                    </View>
                    <View style={styles.locationContent}>
                        <Text style={styles.addressText}>
                            {booking.location?.address || booking.location?.landmark || "Address details not available"}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.detailLabel}>Estimated Fee</Text>
                            <Text style={styles.priceText}>
                                ₹{booking.basePrice || booking.totalAmount || "-"}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.mapBtn}
                            onPress={openMaps}
                        >
                            <Ionicons name="map-outline" size={18} color={APP_COLORS.primary} />
                            <Text style={styles.mapBtnText}>Navigate in Maps</Text>
                        </TouchableOpacity>
                    </View>
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

                {/* History & Significance */}
                {booking.ceremonyDetails?.history && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="book-outline" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>History & Significance</Text>
                        </View>
                        <Text style={styles.notesText}>{booking.ceremonyDetails.history}</Text>
                    </View>
                )}

                {/* Samagri (Materials Required) */}
                {booking.ceremonyDetails && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="list-outline" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Samagri (Materials Required)</Text>
                        </View>
                        {booking.ceremonyDetails.materials && booking.ceremonyDetails.materials.length > 0 ? (
                            booking.ceremonyDetails.materials.map((item: any, index: number) => (
                                <View key={index} style={styles.detailRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                        <Text style={styles.itemSubText}>
                                            Qty: {item.quantity} • {item.isOptional ? 'Optional' : 'Mandatory'}
                                        </Text>
                                    </View>
                                    <View style={[styles.tag, { backgroundColor: item.providedBy === 'devotee' ? '#FFF3E0' : '#E3F2FD' }]}>
                                        <Text style={[styles.tagText, { color: item.providedBy === 'devotee' ? '#E65100' : '#1565C0' }]}>
                                            {item.providedBy === 'devotee' ? 'Devotee' : 'Priest'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noInfoText}>No specific materials list available.</Text>
                        )}

                        {booking.ceremonyDetails.specialInstructions && booking.ceremonyDetails.specialInstructions.length > 0 && (
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: APP_COLORS.lightGray }}>
                                <Text style={[styles.cardTitle, { fontSize: 14, marginBottom: 8 }]}>Special Instructions</Text>
                                {booking.ceremonyDetails.specialInstructions.map((instr: string, idx: number) => (
                                    <View key={idx} style={styles.instrRow}>
                                        <Ionicons name="information-circle-outline" size={16} color={APP_COLORS.info} />
                                        <Text style={styles.instrText}>{instr}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Ritual Steps */}
                {booking.ceremonyDetails?.ritualSteps && booking.ceremonyDetails.ritualSteps.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="footsteps-outline" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Ritual Steps</Text>
                        </View>
                        {booking.ceremonyDetails.ritualSteps.map((step: any, index: number) => (
                            <View key={index} style={styles.stepItem}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                    <Text style={styles.stepDesc}>{step.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Notes */}
                {booking.notes && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={20} color={APP_COLORS.primary} />
                            <Text style={styles.cardTitle}>Notes from Devotee</Text>
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
                        style={[styles.decisionBtn, styles.acceptBtn]}
                        onPress={() => handleStatusUpdate("arrived")}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={APP_COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="location-outline" size={20} color={APP_COLORS.white} />
                                <Text style={styles.acceptBtnText}>I have Arrived</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {isArrived && (
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
                        style={[styles.decisionBtn, { backgroundColor: APP_COLORS.primary }]}
                        onPress={() => handleStatusUpdate("in_progress")}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={APP_COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="flame-outline" size={20} color={APP_COLORS.white} />
                                <Text style={styles.acceptBtnText}>Start Ritual</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {isInProgress && (
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
                                <Text style={styles.acceptBtnText}>End Ritual & Complete</Text>
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
        backgroundColor: APP_COLORS.neutral,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.divider,
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
        fontFamily: "serif",
        fontWeight: "bold",
        color: APP_COLORS.tertiary,
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
    countdownCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: APP_COLORS.primary + "10",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderLeftWidth: 3,
        borderLeftColor: APP_COLORS.primary,
    },
    countdownLabel: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    countdownValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: APP_COLORS.primary,
    },
    requestedOn: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    card: {
        backgroundColor: APP_COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        elevation: 3,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: APP_COLORS.divider,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.divider,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: "serif",
        fontWeight: "bold",
        color: APP_COLORS.tertiary,
    },
    // Enhanced Ceremony Styles
    ceremonyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    ceremonyImg: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: APP_COLORS.neutral,
    },
    ceremonyInfoMain: {
        flex: 1,
        marginLeft: 16,
    },
    ceremonyNameTitle: {
        fontSize: 18,
        fontFamily: "serif",
        fontWeight: 'bold',
        color: APP_COLORS.tertiary,
        marginBottom: 4,
    },
    ceremonySubText: {
        fontSize: 13,
        color: APP_COLORS.gray,
        marginBottom: 8,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600',
        color: APP_COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: APP_COLORS.divider,
        marginVertical: 12,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    scheduleItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: APP_COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleLabel: {
        fontSize: 11,
        color: APP_COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scheduleValue: {
        fontSize: 14,
        fontWeight: '600',
        color: APP_COLORS.black,
    },
    // Status styles
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Devotee styles
    avatarImg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: APP_COLORS.neutral,
    },
    devoteeSubtitle: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    actionIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Location Styles
    locationContent: {
        marginTop: 8,
    },
    addressText: {
        fontSize: 14,
        color: APP_COLORS.black,
        lineHeight: 20,
    },
    landmarkText: {
        fontSize: 13,
        color: APP_COLORS.gray,
        marginTop: 4,
        fontStyle: 'italic',
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: APP_COLORS.primary + '10',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: APP_COLORS.primary + '20',
    },
    mapBtnText: {
        color: APP_COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    // Materials Styles
    materialsList: {
        marginTop: 8,
    },
    materialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 10,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: APP_COLORS.primary,
    },
    materialText: {
        fontSize: 14,
        color: APP_COLORS.tertiary,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.divider,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.success,
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
    notesText: {
        fontSize: 14,
        color: APP_COLORS.bodyText,
        lineHeight: 22,
        fontStyle: "italic",
    },
    // Enriched Details Styles
    noInfoText: {
        fontSize: 14,
        color: APP_COLORS.gray,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '600',
        color: APP_COLORS.black,
    },
    itemSubText: {
        fontSize: 12,
        color: APP_COLORS.gray,
        marginTop: 2,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    instrRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    instrText: {
        fontSize: 13,
        color: APP_COLORS.bodyText,
        flex: 1,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: APP_COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    stepDesc: {
        fontSize: 12,
        color: APP_COLORS.bodyText,
        marginTop: 2,
    },
    // Sticky bottom bar
    bottomBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: APP_COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.divider,
        gap: 12,
        elevation: 8,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    decisionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 100,
        gap: 8,
    },
    rejectBtn: {
        backgroundColor: APP_COLORS.surface,
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
    toast: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 12,
        gap: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        zIndex: 9999,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});

export default PujaRequestDetails;
