import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch, TextInput, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../../constants/Colors';
import priestService from '../../../services/priestService';
import { useFocusEffect, router } from 'expo-router';
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

        const navigateToDetail = () => {
            // Pass the item object as a string param
            router.push({
                pathname: "/priest/(priestScreens)/ServiceDetailScreen",
                params: { service: JSON.stringify(item) }
            });
        };

        const imageUri = item.ceremonyId?.images?.[0]?.url
            ? (item.ceremonyId.images[0].url.startsWith('http')
                ? item.ceremonyId.images[0].url
                : `${process.env.EXPO_PUBLIC_API_URL}${item.ceremonyId.images[0].url}`)
            : 'https://via.placeholder.com/400x200';

        return (
            <TouchableOpacity
                style={[styles.card, !item.isActive && styles.inactiveCard]}
                onPress={navigateToDetail}
                activeOpacity={0.9}
            >
                <ImageBackground
                    source={{ uri: imageUri }}
                    style={styles.cardBackground}
                    imageStyle={styles.cardImage}
                >
                    <View style={styles.cardOverlay}>
                        <View style={styles.cardHeader}>
                            <View style={styles.titleContainer}>
                                <Text style={[styles.serviceName, !item.isActive && styles.inactiveText]}>
                                    {item.ceremonyId?.name || item.name || "Unknown Service"}
                                </Text>
                                <Switch
                                    trackColor={{ false: "#767577", true: APP_COLORS.primary }}
                                    thumbColor={APP_COLORS.white}
                                    onValueChange={() => handleToggleActive(index, item.isActive)}
                                    value={item.isActive}
                                />
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.priceTag}>
                                <Text style={styles.priceLabel}>Base Price</Text>
                                <Text style={styles.priceValue}>₹{item.price}</Text>
                            </View>

                            <View style={styles.detailButton}>
                                <Text style={styles.detailButtonText}>Details</Text>
                                <Ionicons name="arrow-forward" size={16} color={APP_COLORS.white} />
                            </View>
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

            {
                loading ? (
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
                )
            }

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/priest/(priestScreens)/AddServiceScreen")}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color={APP_COLORS.white} />
                <Text style={styles.fabText}>Add New</Text>
            </TouchableOpacity>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    header: {
        // Removed custom header
    },
    title: {
        // Removed custom title
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Space for FAB
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        height: 180,
        overflow: 'hidden',
        backgroundColor: APP_COLORS.white,
    },
    inactiveCard: {
        opacity: 0.8,
    },
    cardBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cardImage: {
        borderRadius: 16,
    },
    cardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for readability
        padding: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    serviceName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: APP_COLORS.white,
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        marginRight: 10,
    },
    inactiveText: {
        color: '#ddd',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceLabel: {
        fontSize: 10,
        color: '#eee',
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.white,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    detailButtonText: {
        color: APP_COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 4,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: APP_COLORS.gray,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: APP_COLORS.primary,
        borderRadius: 30, // Pill shape or circle
        height: 56,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    fabText: {
        color: APP_COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    }
});
