import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../../constants/Colors';
import devoteeService from '../../../services/devoteeService';

export default function ManageAddressesScreen() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await devoteeService.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAddresses();
        }, [])
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updated = await devoteeService.deleteAddress(id);
                            setAddresses(updated);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete address");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.addressCard}>
            <View style={styles.headerRow}>
                <View style={styles.typeContainer}>
                    <Ionicons
                        name={item.type === 'Home' ? 'home' : item.type === 'Work' ? 'briefcase' : 'location'}
                        size={16}
                        color={APP_COLORS.primary}
                    />
                    <Text style={styles.typeText}>{item.type}</Text>
                    {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>DEFAULT</Text></View>}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(devoteeScreens)/profile/AddEditAddress", params: { address: JSON.stringify(item) } })}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionText}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id)}
                        style={[styles.actionButton, { marginLeft: 12 }]}
                    >
                        <Text style={[styles.actionText, { color: APP_COLORS.error }]}>DELETE</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.addressText}>
                {item.street}, {item.area}
            </Text>
            <Text style={styles.addressText}>
                {item.city}, {item.state} - {item.zip}
            </Text>
            {item.phone && <Text style={styles.phoneText}>Phone: {item.phone}</Text>}
        </View>
    );

    if (loading && addresses.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={addresses}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={64} color={APP_COLORS.lightGray} />
                        <Text style={styles.emptyText}>No addresses saved yet</Text>
                        <Text style={styles.emptySubText}>Add an address to speed up bookings</Text>
                    </View>
                }
            />
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push("/(devoteeScreens)/profile/AddEditAddress")}
                >
                    <Text style={styles.addButtonText}>ADD NEW ADDRESS</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    addressCard: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 6,
        color: APP_COLORS.black,
        textTransform: 'uppercase',
    },
    defaultBadge: {
        backgroundColor: APP_COLORS.primary + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    defaultText: {
        fontSize: 10,
        color: APP_COLORS.primary,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 4,
    },
    actionText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: APP_COLORS.primary,
    },
    addressText: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginBottom: 2,
        lineHeight: 20,
    },
    phoneText: {
        fontSize: 14,
        color: APP_COLORS.black,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.gray,
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: APP_COLORS.white,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
    },
    addButton: {
        backgroundColor: APP_COLORS.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    addButtonText: {
        color: APP_COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
