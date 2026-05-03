import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { APP_COLORS } from '../../../constants/Colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import priestService from '../../../services/priestService';


export default function RequestsTab() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, success: boolean) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, success });
        toastAnim.setValue(0);
        Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
        toastTimer.current = setTimeout(() => {
            Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
        }, 2500);
    };

    const loadRequests = async () => {
        if (!userInfo?._id) return;
        try {
            setLoading(true);
            // Fetch all bookings then filter both 'pending' and 'requested' client-side
            const data = await priestService.getBookings(userInfo._id);
            const all = Array.isArray(data) ? data : (data?.all || data?.data || []);
            const filtered = all.filter((b: any) => b.status === 'pending' || b.status === 'requested');
            setRequests(filtered);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [])
    );

    const handleAction = async (bookingId: string, action: 'confirm' | 'reject') => {
        try {
            const status = action === 'confirm' ? 'confirmed' : 'cancelled';
            const notes = action === 'reject' ? 'Priest is unavailable' : undefined;
            await priestService.updateBookingStatus(bookingId, status, notes);
            showToast(
                action === 'confirm' ? '✓ Booking accepted successfully' : 'Booking rejected',
                action === 'confirm'
            );
            loadRequests();
        } catch (error) {
            showToast('Failed to update booking status', false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.devoteeId?.name?.charAt(0) || 'D'}</Text>
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.userName}>{item.devoteeId?.name || 'Devotee'}</Text>
                        {item.devoteeId?.rating && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                <Ionicons name="star" size={12} color="#FFD700" />
                                <Text style={{
                                    marginLeft: 4,
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: (item.devoteeId.rating.average || 0) > 4.5 ? APP_COLORS.success :
                                        (item.devoteeId.rating.average || 0) >= 3.0 ? APP_COLORS.warning : APP_COLORS.error
                                }}>
                                    {item.devoteeId.rating.average?.toFixed(1) || "0.0"}
                                </Text>
                                <Text style={{ fontSize: 12, color: APP_COLORS.gray, marginLeft: 2 }}>
                                    ({item.devoteeId.rating.count || 0} reviews)
                                </Text>
                            </View>
                        )}
                        <Text style={styles.timestamp}>Requested on {new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.priceTag}>
                    <Text style={styles.priceText}>₹{item.basePrice}</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.ceremonyTitle}>{item.ceremonyType || item.ceremony}</Text>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText}>{new Date(item.date).toDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText}>{item.startTime || item.time}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={APP_COLORS.gray} />
                    <Text style={styles.detailText}>
                        {item.location?.address || `${item.location?.city || 'Location'}, ${item.location?.state || ''}`}
                    </Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleAction(item._id, 'reject')}
                >
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleAction(item._id, 'confirm')}
                >
                    <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing && requests.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <FlatList
                data={requests}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={() => {
                    setRefreshing(true);
                    loadRequests();
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="documents-outline" size={48} color={APP_COLORS.lightGray} />
                        <Text style={styles.emptyText}>No pending requests</Text>
                    </View>
                }
            />

            {/* Toast */}
            {toast && (
                <Animated.View
                    style={[
                        styles.toast,
                        { backgroundColor: toast.success ? '#2E7D32' : '#B22222' },
                        {
                            transform: [{
                                translateY: toastAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [80, 0],
                                })
                            }],
                            opacity: toastAnim,
                        }
                    ]}
                >
                    <Ionicons
                        name={toast.success ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.neutral,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingTop: 8,
    },
    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: APP_COLORS.divider,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: APP_COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.primary,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'serif',
        color: APP_COLORS.tertiary,
    },
    timestamp: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    priceTag: {
        backgroundColor: APP_COLORS.success + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: APP_COLORS.success,
    },
    detailsContainer: {
        backgroundColor: APP_COLORS.neutral,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    ceremonyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'serif',
        color: APP_COLORS.tertiary,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        marginLeft: 8,
        color: APP_COLORS.gray,
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#D98934',
    },
    rejectButton: {
        backgroundColor: APP_COLORS.white,
        borderWidth: 1.5,
        borderColor: '#B22222',
    },
    acceptText: {
        color: APP_COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    rejectText: {
        color: '#B22222',
        fontWeight: 'bold',
        fontSize: 14,
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: APP_COLORS.gray,
        fontSize: 16,
    },
    toast: {
        position: 'absolute',
        bottom: 24,
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
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
