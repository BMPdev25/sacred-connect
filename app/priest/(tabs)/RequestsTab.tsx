import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../../constants/Colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import priestService from '../../../services/priestService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequestsTab() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRequests = async () => {
        if (!userInfo?._id) return;
        try {
            setLoading(true);
            // Assuming getBookings supports filtering by status
            const data = await priestService.getBookings(userInfo._id, 'pending');
            const arr = Array.isArray(data) ? data : data?.data || [];
            setRequests(arr);
        } catch (error) {
            console.error('Error loading requests:', error);
            // Removed Alert to avoid spamming on mount if offline
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

            Alert.alert(
                action === 'confirm' ? 'Accepted' : 'Rejected',
                `Booking ${action === 'confirm' ? 'accepted' : 'rejected'} successfully`
            );

            // Refresh list
            loadRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to update booking status');
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Booking Requests</Text>
            </View>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: APP_COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: APP_COLORS.black,
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
        backgroundColor: APP_COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    ceremonyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: APP_COLORS.primary,
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
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: APP_COLORS.primary,
    },
    rejectButton: {
        backgroundColor: APP_COLORS.white,
        borderWidth: 1,
        borderColor: APP_COLORS.error,
    },
    acceptText: {
        color: APP_COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    rejectText: {
        color: APP_COLORS.error,
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
    }
});
