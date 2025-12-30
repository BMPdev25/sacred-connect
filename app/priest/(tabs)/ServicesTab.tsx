import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../../constants/Colors';
import priestService from '../../../services/priestService';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ServicesTab() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null); // keeping track of which service is updating
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState('');

    const fetchServices = async () => {
        try {
            setLoading(true);
            const profile = await priestService.getProfile();
            // Ensure services have an isActive flag if missing (default true)
            const serviceList = (profile.services || []).map((s: any) => ({
                ...s,
                isActive: s.isActive !== undefined ? s.isActive : true
            }));
            setServices(serviceList);
        } catch (error) {
            console.error('Error fetching services:', error);
            Alert.alert("Error", "Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [])
    );

    const handleToggleActive = async (index: number, currentValue: boolean) => {
        const newServices = [...services];
        const service = newServices[index];
        service.isActive = !currentValue;
        setServices(newServices); // Optimistic update

        try {
            // Retrieve only necessary fields for update if the API expects partial object 
            // OR send the whole services array if that's how updateProfile works.
            // Based on priestService.ts updateProfile takes profileData.

            // We need to strip extra UI fields if any, but currently we just added isActive.
            // Warning: We are sending the WHOLE service list. This is potentially risky if concurrent edits happen,
            // but standard for this simple architecture.

            await priestService.updateProfile({ services: newServices });
        } catch (error) {
            console.error("Error updating service status", error);
            Alert.alert("Error", "Failed to update status");
            // Revert
            service.isActive = currentValue;
            setServices([...newServices]);
        }
    };

    const startEditingPrice = (id: string, currentPrice: number) => {
        setEditingPriceId(id);
        setTempPrice(currentPrice.toString());
    };

    const savePrice = async (index: number) => {
        const newServices = [...services];
        const service = newServices[index];
        const oldPrice = service.price;

        if (parseFloat(tempPrice) === oldPrice) {
            setEditingPriceId(null);
            return;
        }

        service.price = parseFloat(tempPrice);
        setServices(newServices);
        setEditingPriceId(null);
        setUpdating(service._id || index.toString());

        try {
            await priestService.updateProfile({ services: newServices });
        } catch (error) {
            console.error("Error updating price", error);
            Alert.alert("Error", "Failed to update price");
            service.price = oldPrice;
            setServices([...newServices]);
        } finally {
            setUpdating(null);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isEditing = editingPriceId === (item._id || index.toString());
        const isUpdating = updating === (item._id || index.toString());
        const serviceId = item._id || index.toString();

        return (
            <View style={[styles.card, !item.isActive && styles.inactiveCard]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.serviceName, !item.isActive && styles.inactiveText]}>
                        {item.ceremonyId?.name || item.name || "Unknown Service"}
                    </Text>
                    <Switch
                        trackColor={{ false: "#767577", true: APP_COLORS.primary + '80' }}
                        thumbColor={item.isActive ? APP_COLORS.primary : "#f4f3f4"}
                        onValueChange={() => handleToggleActive(index, item.isActive)}
                        value={item.isActive}
                    />
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.label}>Base Price:</Text>
                        {isEditing ? (
                            <View style={styles.editPriceContainer}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    value={tempPrice}
                                    onChangeText={setTempPrice}
                                    keyboardType="numeric"
                                    autoFocus
                                    onBlur={() => savePrice(index)}
                                />
                                <TouchableOpacity onPress={() => savePrice(index)} style={styles.saveButton}>
                                    <Ionicons name="checkmark" size={18} color={APP_COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.priceDisplay}
                                onPress={() => startEditingPrice(serviceId, item.price)}
                            >
                                <Text style={[styles.priceValue, !item.isActive && styles.inactiveText]}>
                                    ₹{item.price}
                                </Text>
                                <Ionicons name="pencil" size={14} color={APP_COLORS.primary} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isUpdating && <ActivityIndicator size="small" color={APP_COLORS.primary} />}

                    {/* Placeholder for "Details" navigation if needed later */}
                    {/* <TouchableOpacity style={styles.detailsButton}>
                        <Text style={styles.detailsText}>Details</Text>
                    </TouchableOpacity> */}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Services</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Coming Soon", "Add Service feature coming soon")}>
                    <Ionicons name="add" size={24} color={APP_COLORS.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={APP_COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No services offered yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: APP_COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    addButton: {
        backgroundColor: APP_COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inactiveCard: {
        opacity: 0.7,
        backgroundColor: '#f9f9f9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: APP_COLORS.black,
        flex: 1,
    },
    inactiveText: {
        color: APP_COLORS.gray,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginRight: 8,
    },
    priceDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    priceInput: {
        fontSize: 16,
        fontWeight: 'bold',
        color: APP_COLORS.black,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.primary,
        minWidth: 60,
        textAlign: 'center',
        marginHorizontal: 4,
        paddingVertical: 2,
    },
    editPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currency: {
        fontSize: 16,
        color: APP_COLORS.gray,
    },
    saveButton: {
        backgroundColor: APP_COLORS.success || 'green',
        borderRadius: 12,
        padding: 4,
        marginLeft: 8,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: APP_COLORS.gray,
        fontSize: 16,
    }
});
